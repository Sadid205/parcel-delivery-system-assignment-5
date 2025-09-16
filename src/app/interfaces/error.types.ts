export interface TErrorSources {
  path: string;
  message: string;
}

export interface TMongooseErrorSource {
  path: string;
  value: string;
  message: string;
}

export interface TGenericErrorResponse {
  statusCode: number;
  message: string;
  errorSources?: TErrorSources[] | TMongooseErrorSource[];
}
