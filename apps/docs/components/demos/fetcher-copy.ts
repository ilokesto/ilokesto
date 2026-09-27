export const fetcherCopy = {
  en: {
    title: 'Handle an HTTP result without throwing',
    description:
      'Send a same-origin request and inspect the structured success or failure returned by the safe API.',
    instructions: 'Choose the deterministic response you want to inspect.',
    successAction: 'Request demo success',
    errorAction: 'Request demo error',
    reset: 'Reset',
    idle: 'No request sent yet.',
    loading: 'Requesting the demo response...',
    demoLabel: 'Fictional demo response',
    success: 'Success',
    error: 'Error',
    status: 'HTTP status',
    id: 'Profile ID',
    name: 'Name',
    role: 'Role',
    code: 'Error code',
    message: 'Message',
    noResponse: 'No HTTP response',
  },
  ko: {
    title: '예외 없이 HTTP 결과 처리하기',
    description:
      '동일 출처 요청을 보내고 safe API가 반환하는 구조화된 성공 또는 실패 결과를 확인하세요.',
    instructions: '성공 또는 오류 응답을 선택해 결과를 확인하세요.',
    successAction: '데모 성공 요청',
    errorAction: '데모 오류 요청',
    reset: '초기화',
    idle: '아직 요청을 보내지 않았습니다.',
    loading: '데모 응답을 요청하고 있습니다...',
    demoLabel: '가상의 데모 응답',
    success: '성공',
    error: '오류',
    status: 'HTTP 상태',
    id: '프로필 ID',
    name: '이름',
    role: '역할',
    code: '오류 코드',
    message: '메시지',
    noResponse: 'HTTP 응답 없음',
  },
} as const;

export const fetcherSnippets = {
  en: `// This endpoint returns fictional demo data only.
const api = createFetcher<DemoPaths>();
const controller = new AbortController();
const result = await api.safe.get('/api/demo/fetcher', {
  params: { query: { outcome: 'success' } },
}, { signal: controller.signal, retry: 0 });

if (result.ok) {
  console.log(result.response.status, result.data.profile);
} else {
  console.log(result.response?.status, result.error);
}`,
  ko: `// 이 엔드포인트는 가상의 데모 데이터만 반환합니다.
const api = createFetcher<DemoPaths>();
const controller = new AbortController();
const result = await api.safe.get('/api/demo/fetcher', {
  params: { query: { outcome: 'success' } },
}, { signal: controller.signal, retry: 0 });

if (result.ok) {
  console.log(result.response.status, result.data.profile);
} else {
  console.log(result.response?.status, result.error);
}`,
} as const;
