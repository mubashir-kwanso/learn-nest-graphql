import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import { GqlArgumentsHost, GqlContextType } from '@nestjs/graphql';
import { GraphQLError } from 'graphql';
import { PinoLogger } from '../logger/pino-logger';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = PinoLogger.createLogger({
    name: GlobalExceptionFilter.name,
  });

  catch(exception: Error, host: ArgumentsHost) {
    const contextType = host.getType<GqlContextType>();

    // If the request is not HTTP or GraphQL, throw the exception as it is
    if (contextType !== 'http' && contextType !== 'graphql') {
      throw exception;
    }

    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    // Log the exception
    this.logException({
      exception,
      host,
      contextType,
    });

    // Uniform error response
    const errorResponse = {
      code: 'INTERNAL_SERVER_ERROR',
      statusCode: 500,
      message: 'Internal server error',
    };

    if (exception instanceof HttpException) {
      errorResponse.code = exception.name;
      errorResponse.statusCode = exception.getStatus();
      errorResponse.message = exception.message;
    }

    // Handle GraphQL errors
    if (contextType === 'graphql') {
      const gqlError = new GraphQLError(errorResponse.message, {
        extensions: errorResponse,
      });
      gqlError.stack = exception.stack;
      return gqlError;
    } else {
      // Handle HTTP errors
      response.status(errorResponse.statusCode).json(errorResponse);
    }
  }

  private logException({
    exception,
    host,
    contextType,
  }: {
    exception: Error;
    host: ArgumentsHost;
    contextType: 'http' | 'graphql';
  }) {
    const isHttpException = exception instanceof HttpException;

    const ctx = host.switchToHttp();
    const request = ctx.getRequest();

    let gqlHost: GqlArgumentsHost | null = null;
    if (contextType === 'graphql') {
      gqlHost = GqlArgumentsHost.create(host);
    }

    const log = {
      name: exception.name,
      message: exception.message,
      ...(isHttpException
        ? {
            exceptionResponse: exception.getResponse(),
          }
        : {}),
      requestContext: {
        type: contextType,
        ...(contextType === 'graphql' &&
          gqlHost && {
            path: gqlHost.getInfo().path,
            args: gqlHost.getArgs(),
          }),
        ...(contextType === 'http' && {
          path: request.url,
          body: request.body,
          query: request.query,
          params: request.params,
        }),
      },
      stack: exception.stack,
    };

    if (exception instanceof HttpException && exception.getStatus() < 500) {
      this.logger.warn(log);
    } else {
      this.logger.error(log);
    }
  }
}
