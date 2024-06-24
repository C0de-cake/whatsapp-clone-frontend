import {Pagination} from "../../../../shared/model/request.model";

export interface SearchQuery {
  query: string,
  page: Pagination
}
