export interface SearchModel {
  page: number;
  limit: number;
  firstLimit?: number;
  fields?: string[];
  sort?: string;
}
export interface SearchResult<T> {
  total?: number;
  results: T[];
  last?: boolean;
}
export interface Locale {
  id?: string;
  countryCode: string;
  dateFormat: string;
  firstDayOfWeek: number;
  decimalSeparator: string;
  groupSeparator: string;
  decimalDigits: number;
  currencyCode: string;
  currencySymbol: string;
  currencyPattern: number;
  currencySample?: string;
}
export interface LocaleFormatter<T> {
  format(obj: T, locale: Locale): T;
}
export interface ResourceService {
  resource(): any;
  value(key: string, param?: any): string;
  format(...args: any[]): string;
}

export interface Sortable {
  sortField: string;
  sortType: string;
  sortTarget: any;
}

export interface Pagination {
  initPageSize: number;
  pageSize: number;
  pageIndex: number;
  itemTotal: number;
  pageTotal: number;
  showPaging: boolean;
  append: boolean;
  appendMode: boolean;
  appendable: boolean;
}

export interface Searchable extends Pagination, Sortable {

}
export function reset(com: Searchable) {
  removeSortStatus(com.sortTarget);
  com.sortTarget = null;
  com.sortField = null;
  com.append = false;
  com.pageIndex = 1;
}
export function changePageSize(com: Pagination, size: number): void {
  com.initPageSize = size;
  com.pageSize = size;
  com.pageIndex = 1;
}
export function changePage(com: Pagination, pageIndex: number, pageSize: number): void {
  com.pageIndex = pageIndex;
  com.pageSize = pageSize;
  com.append = false;
}
export function optimizeSearchModel<S extends SearchModel>(obj: S, searchable: Searchable, displayFields: string[]): S {
  obj.fields = displayFields;
  if (searchable.pageIndex && searchable.pageIndex > 1) {
    obj.page = searchable.pageIndex;
  } else {
    delete obj.page;
  }
  obj.limit = searchable.pageSize;
  if (searchable.appendMode && searchable.initPageSize !== searchable.pageSize) {
    obj.firstLimit = searchable.initPageSize;
  } else {
    delete obj.firstLimit;
  }
  if (searchable.sortField && searchable.sortField.length > 0) {
    obj.sort = (searchable.sortType === '-' ? '-' + searchable.sortField : searchable.sortField);
  } else {
    delete obj.sort;
  }
  return obj;
}

export function append<T>(list: T[], results: T[]): T[] {
  if (list && results) {
    for (const obj of results) {
      list.push(obj);
    }
  }
  return list;
}
export function showResults<T>(s: SearchModel, sr: SearchResult<T>, com: Pagination) {
  com.pageIndex = (s.page && s.page >= 1 ? s.page : 1);
  if (sr.total) {
    com.itemTotal = sr.total;
  }
  if (com.appendMode === false) {
    showPaging(s, sr, com);
  } else {
    handleAppend(s, sr, com);
  }
}
export function handleAppend<T, S extends SearchModel>(s: S, sr: SearchResult<T>, com: Pagination) {
  if (s.limit === 0) {
    com.appendable = false;
  } else {
    let pageSize = s.limit;
    if (s.page <= 1) {
      pageSize = s.firstLimit;
    }
    if (sr.last === true || sr.results.length < pageSize) {
      com.appendable = false;
    } else {
      com.appendable = true;
    }
  }
  if (sr && sr.results.length === 0) {
    com.appendable = false;
  }
}
export function showPaging<T>(s: SearchModel, sr: SearchResult<T>, com: Pagination): void {
  com.itemTotal = sr.total;
  const pageTotal = getPageTotal(sr.total, s.limit);
  com.pageTotal = pageTotal;
  com.showPaging = (com.pageTotal <= 1 ? false : true);
}

export function getDisplayFields(form: any): string[] {
  const nodes = form.nextSibling;
  const table = nodes.querySelector('table');
  const fields: string[] = [];
  if (table) {
    const thead = table.querySelector('thead');
    if (thead) {
      const ths = thead.querySelectorAll('th');
      if (ths) {
        for (const th of ths) {
          const field = th.getAttribute('data-field');
          if (field) {
            fields.push(field);
          }
        }
      }
    }
  }
  return fields;
}

export function formatResults<T>(results: T[], formatter: LocaleFormatter<T>, locale: Locale, sequenceNo: string, pageIndex: number, pageSize: number, initPageSize: number) {
  if (results && results.length > 0) {
    let hasSequencePro = false;
    if (formatter) {
      for (const obj of results) {
        if (obj[sequenceNo]) {
          hasSequencePro = true;
        }
        formatter.format(obj, locale);
      }
    } else {
      for (const obj of results) {
        if (obj[sequenceNo]) {
          hasSequencePro = true;
        }
      }
    }
    if (!hasSequencePro) {
      if (!pageIndex) {
        pageIndex = 1;
      }
      if (pageIndex <= 1) {
        for (let i = 0; i < results.length; i++) {
          results[i][sequenceNo] = i - pageSize + pageSize * pageIndex + 1;
        }
      } else {
        for (let i = 0; i < results.length; i++) {
          results[i][sequenceNo] = i - pageSize + pageSize * pageIndex + 1 - (pageSize - initPageSize);
        }
      }
    }
  }
}

export function getPageTotal(recordTotal: number, pageSize: number) {
  if (pageSize <= 0) {
    return 1;
  } else {
    if ((recordTotal % pageSize) === 0) {
      return Math.floor((recordTotal / pageSize));
    }
    return Math.floor((recordTotal / pageSize) + 1);
  }
}

export function buildSearchMessage<T>(s: SearchModel, sr: SearchResult<T>, r: ResourceService): string {
  const results = sr.results;
  if (!results || results.length === 0) {
    return r.value('msg_no_data_found');
  } else {
    if (!s.page) {
      s.page = 1;
    }
    const fromIndex = (s.page - 1) * s.limit + 1;
    const toIndex = fromIndex + results.length - 1;
    const pageTotal = getPageTotal(sr.total, s.limit);
    if (pageTotal > 1) {
      const msg2 = r.format(r.value('msg_search_result_page_sequence'), fromIndex, toIndex, sr.total, s.page, pageTotal);
      return msg2;
    } else {
      const msg3 = r.format(r.value('msg_search_result_sequence'), fromIndex, toIndex);
      return msg3;
    }
  }
}

function removeFormatUrl(url: string) {
  const startParams = url.indexOf('?');
  return startParams !== -1 ? url.substring(0, startParams) : url;
}


export function addParametersIntoUrl<S extends SearchModel>(searchModel: S, isFirstLoad: boolean) {
  if (!isFirstLoad) {
    const pageIndex = searchModel.page;
    if (pageIndex && !isNaN(pageIndex) && pageIndex <= 1) {
      delete searchModel.page;
    }
    const keys = Object.keys(searchModel);
    const currentUrl = window.location.host + window.location.pathname;
    let url = removeFormatUrl(currentUrl);
    for (const key of keys) {
      const objValue = searchModel[key];
      if (objValue) {
        if (key !== 'fields') {
          if (typeof objValue === 'string' || typeof objValue === 'number') {
            if (url.indexOf('?') === -1) {
              url += `?${key}=${objValue}`;
            } else {
              url += `&${key}=${objValue}`;
            }
          } else if (typeof objValue === 'object') {
            if (objValue instanceof Date) {
              if (url.indexOf('?') === -1) {
                url += `?${key}=${objValue.toISOString()}`;
              } else {
                url += `&${key}=${objValue.toISOString()}`;
              }
            } else {
              if (Array.isArray(objValue)) {
                if (objValue.length > 0) {
                  const strs = [];
                  for (const subValue of objValue) {
                    if (typeof subValue === 'string') {
                      strs.push(subValue);
                    } else if (typeof subValue === 'number') {
                      strs.push(subValue.toString());
                    }
                  }
                  if (url.indexOf('?') === -1) {
                    url += `?${key}=${strs.join(',')}`;
                  } else {
                    url += `&${key}=${strs.join(',')}`;
                  }
                }
              } else {
                const keysLvl2 = Object.keys(objValue);
                keysLvl2.forEach((key2, idx) => {
                  const objValueLvl2 = objValue[keysLvl2[idx]];
                  if (url.indexOf('?') === -1) {
                    if (objValueLvl2 instanceof Date) {
                      url += `?${key}.${key2}=${objValueLvl2.toISOString()}`;
                    } else {
                      url += `?${key}.${key2}=${objValueLvl2}`;
                    }
                  } else {
                    if (objValueLvl2 instanceof Date) {
                      url += `&${key}.${key2}=${objValueLvl2.toISOString()}`;
                    } else {
                      url += `&${key}.${key2}=${objValueLvl2}`;
                    }
                  }
                });
              }
            }
          }
        }
      }
    }
    let p = 'http://';
    const loc = window.location.href;
    if (loc.length >= 8) {
      const ss = loc.substr(0, 8);
      if (ss === 'https://') {
        p = 'https://';
      }
    }
    window.history.replaceState({path: currentUrl}, '', p + url);
  }
}

export interface Sort {
  field: string;
  type: string;
}

export function handleSortEvent(event: any, com: Sortable) {
  if (event && event.target) {
    const target = event.target;
    const s = handleSort(target, com.sortTarget, com.sortField, com.sortType);
    com.sortField = s.field;
    com.sortType = s.type;
    com.sortTarget = target;
  }
}

export function handleSort(target: any, previousTarget: any, sortField: string, sortType: string): Sort {
  const type = target.getAttribute('sort-type');
  const field = toggleSortStyle(target);
  const s = sort(sortField, sortType, field, type);
  if (sortField !== field) {
    removeSortStatus(previousTarget);
  }
  return s;
}

export function sort(preField: string, preSortType: string, field: string, sortType: string): Sort {
  if (!preField || preField === '') {
    const s: Sort = {
      field,
      type: '+'
    };
    return s;
  } else if (preField !== field) {
    const s: Sort = {
      field,
      type: (!sortType ? '+' : sortType)
    };
    return s;
  } else if (preField === field) {
    const type = (preSortType === '+' ? '-' : '+');
    const s: Sort = {field, type};
    return s;
  }
}

export function removeSortStatus(target: any): void {
  if (target && target.children.length > 0) {
    target.removeChild(target.children[0]);
  }
}

export function toggleSortStyle(target: any): string {
  let field = target.getAttribute('data-field');
  if (!field) {
    field = target.parentNode.getAttribute('data-field');
  }
  if (!field || field.length === 0) {
    return '';
  }
  if (target.nodeName === 'I') {
    target = target.parentNode;
  }
  let i = null;
  if (target.children.length === 0) {
    target.innerHTML = target.innerHTML + '<i class="sort-up"></i>';
  } else {
    i = target.children[0];
    if (i.classList.contains('sort-up')) {
      i.classList.remove('sort-up');
      i.classList.add('sort-down');
    } else if (i.classList.contains('sort-down')) {
      i.classList.remove('sort-down');
      i.classList.add('sort-up');
    }
  }
  return field;
}