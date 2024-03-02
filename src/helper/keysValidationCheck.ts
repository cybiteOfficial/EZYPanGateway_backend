export async function keyValidationCheck(
  reqBody: any,
  reqParams,
  requiredKeys,
) {
  if (Object.keys(reqBody).length === 0) {
    return {
      message: 'Empty request found. Request information is required',
      status: false,
    };
  }
  for (const key in reqBody) {
    if (!reqParams.includes(key)) {
      return {
        message: 'Invalid data/key ' + key + ' found in request.',
        status: false,
      };
    }
  }

  const inputKeys = Object.keys(reqBody);
  if (requiredKeys.length > 0) {
    for (const ind in requiredKeys) {
      if (!inputKeys.includes(requiredKeys[ind])) {
        return {
          message: requiredKeys[ind] + ' is required.',
          status: false,
        };
      } else if (
        reqBody[requiredKeys[ind]] === undefined ||
        reqBody[requiredKeys[ind]] === null ||
        reqBody[requiredKeys[ind]] === '' ||
        reqBody[requiredKeys[ind]] === 'undefined' ||
        reqBody[requiredKeys[ind]] === 'null'
      ) {
        return {
          message: requiredKeys[ind] + ' is required.',
          status: false,
        };
      }
    }
  }
  return {
    message: 'all good',
    status: true,
  };
}
