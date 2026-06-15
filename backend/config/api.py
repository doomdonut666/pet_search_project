from rest_framework import status
from rest_framework.exceptions import (
    AuthenticationFailed,
    NotAuthenticated,
    NotFound,
    PermissionDenied,
    ValidationError,
)
from rest_framework.response import Response
from rest_framework.views import exception_handler


def api_exception_handler(exc, context):
    response = exception_handler(exc, context)
    if response is None:
        return None

    if isinstance(exc, ValidationError):
        return Response({
            'error': {
                'code': 422,
                'message': 'Validation error',
                'errors': response.data,
            }
        }, status=status.HTTP_422_UNPROCESSABLE_ENTITY)

    if isinstance(exc, (AuthenticationFailed, NotAuthenticated)):
        return Response({
            'error': {
                'code': 401,
                'message': 'Unauthorized',
            }
        }, status=status.HTTP_401_UNAUTHORIZED)

    if isinstance(exc, PermissionDenied):
        return Response({
            'error': {
                'code': 403,
                'message': 'Access denied',
            }
        }, status=status.HTTP_403_FORBIDDEN)

    if isinstance(exc, NotFound):
        return Response({
            'error': {
                'code': 404,
                'message': 'Not found',
            }
        }, status=status.HTTP_404_NOT_FOUND)

    return response
