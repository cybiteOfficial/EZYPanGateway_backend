export const errorRes = (err) => {
  let i = 1;
  let error_msg = '';
  const statusCode =
    err.status !== undefined && err.status !== null ? err.status : 500;
  if (!err.message) {
    for (const key in err.errors) {
      if (err.errors[key].message) {
        error_msg += i + '.' + err.errors[key].message;
        i++;
      }
    }
  } else {
    error_msg = err.message;
  }

  return {
    statusCode: statusCode,
    resData: {
      message: error_msg,
      status: false,
      data: null,
      code: 'ERR',
      issue: 'SOME_ERROR_OCCURED',
    },
  };
};
