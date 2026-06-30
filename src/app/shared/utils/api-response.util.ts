type ApiResponseShape<T> = {
  data?: T;
};

export function unwrapApiResponse<T>(response: unknown, fallback: T): T {
  if (response && typeof response === 'object' && 'data' in response) {
    return (response as ApiResponseShape<T>).data ?? fallback;
  }

  return (response as T) ?? fallback;
}

export function unwrapApiList<T>(response: unknown): T[] {
  return unwrapApiResponse<T[]>(response, []);
}