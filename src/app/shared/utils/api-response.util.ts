type ApiResponseShape<T> = {
  data?: T;
};

export function unwrapApiResponse<T>(response: T | ApiResponseShape<T> | null | undefined, fallback: T): T {
  if (response && typeof response === 'object' && 'data' in response) {
    return (response as ApiResponseShape<T>).data ?? fallback;
  }

  return (response as T) ?? fallback;
}

export function unwrapApiList<T>(response: T[] | ApiResponseShape<T[]> | null | undefined): T[] {
  return unwrapApiResponse<T[]>(response, []);
}