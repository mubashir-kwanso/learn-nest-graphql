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
  const unwrappedError = unwrapResolverError(error);

  if (unwrappedError instanceof HttpException) {
    const httpException = unwrappedError as HttpException;
    return {
      ...formattedError,
      extensions: formattedError.extensions
        ? {
            ...formattedError.extensions,
            code: httpException.name,
          }
        : undefined,
    };
  }

  const internalServerErrorException = new InternalServerErrorException(
    'Something went wrong',
  );
  return {
    ...formattedError,
    message: internalServerErrorException.message,
    extensions: {
      code: internalServerErrorException.name,
      status: internalServerErrorException.getStatus(),
      originalError: internalServerErrorException.getResponse(),
    },
  };
};
