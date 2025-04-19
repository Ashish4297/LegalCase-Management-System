export class ApiError extends Error {
  constructor(
    public status: number,
    public message: string,
    public data?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const handleApiError = (error: any): never => {
  if (error.response) {
    // Server responded with error
    throw new ApiError(
      error.response.status,
      error.response.data.message || 'Server error',
      error.response.data
    );
  } else if (error.request) {
    // Request made but no response
    throw new ApiError(
      503,
      'Unable to reach server. Please check your connection.'
    );
  } else {
    // Request setup error
    throw new ApiError(
      500,
      error.message || 'An unexpected error occurred'
    );
  }
};