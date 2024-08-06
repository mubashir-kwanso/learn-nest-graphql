import { HttpException, InternalServerErrorException } from '@nestjs/common';
import { GraphQLFormattedError } from 'graphql';
import { unwrapResolverError } from '@apollo/server/errors';

export const graphqlFormatError = (
  formattedError: GraphQLFormattedError,
  error: unknown,
) => {
  console.dir(error, {
    depth: Infinity,
  });
  // unwrapResolverError removes the outer GraphQLError wrapping from
  // errors thrown in resolvers, enabling us to check the instance of
  // the original error
  const unwrappedError = unwrapResolverError(error) as HttpException;

  if (unwrappedError instanceof HttpException) {
    return {
      ...formattedError,
      extensions: formattedError.extensions
        ? {
            ...formattedError.extensions,
            code: unwrappedError.name,
          }
        : undefined,
    };
  }

  const internalServerError = new InternalServerErrorException(
    'Something went wrong',
  );
  return {
    ...formattedError,
    message: internalServerError.message,
    extensions: {
      code: internalServerError.name,
      status: internalServerError.getStatus(),
      originalError: internalServerError.getResponse(),
    },
  };
};
