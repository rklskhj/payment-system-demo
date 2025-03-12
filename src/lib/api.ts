/**
 * API 호출을 위한 기본 함수
 */

export async function fetchApi<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "API 요청 중 오류가 발생했습니다.");
  }

  return response.json();
}

export async function postApi<T, D = unknown>(
  url: string,
  data: D,
  options: RequestInit = {}
): Promise<T> {
  return fetchApi<T>(url, {
    ...options,
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function putApi<T, D = unknown>(
  url: string,
  data: D,
  options: RequestInit = {}
): Promise<T> {
  return fetchApi<T>(url, {
    ...options,
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteApi<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  return fetchApi<T>(url, {
    ...options,
    method: "DELETE",
  });
}
