import {
  TGenericErrorResponse,
  TMongooseErrorSource,
} from "../interfaces/error.types";

export const handleDuplicateKeyError = (err: any): TGenericErrorResponse => {
  const matchedArray = err.errorResponse?.errmsg.match(/"([^"]*)"/);
  const errorSources: TMongooseErrorSource[] = [];
  for (const key in err.keyPattern) {
    errorSources.push({
      path: key,
      value: err.keyValue[key],
      message: `${key} '${err.keyValue[key]}' Is Already Taken`,
    });
  }
  return {
    statusCode: 400,
    message: `${matchedArray[1]} Already Exists`,
    errorSources,
  };
};
