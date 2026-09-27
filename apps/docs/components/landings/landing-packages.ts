export const landingPackages = [
  { name: 'store', title: 'Store', en: 'A little home for your state.', ko: '작은 상태를 담는, 가벼운 시작.' },
  { name: 'state', title: 'State', en: 'One state. Room for every view.', ko: '하나의 상태, 저마다의 화면.' },
  { name: 'form', title: 'Form', en: 'From the first input to the final check.', ko: '첫 입력부터 마지막 검증까지.' },
  { name: 'overlay', title: 'Overlay', en: 'A little room above your interface.', ko: '화면 위에, 필요한 만큼의 공간.' },
  { name: 'modal', title: 'Modal', en: 'Make room for the next decision.', ko: '다음 선택에 집중할 시간.' },
  { name: 'toast', title: 'Toast', en: 'Small messages. Just in time.', ko: '필요한 순간, 작은 소식 하나.' },
  { name: 'fetcher', title: 'Fetcher', en: 'Send a request. Know what comes back.', ko: '요청을 보내고, 결과를 명확하게.' },
  { name: 'utilinent', title: 'Utilinent', en: 'The right pieces, in the right places.', ko: '필요한 조각을, 알맞은 자리에.' },
] as const;

export type LandingPackage = (typeof landingPackages)[number];

export function getLandingPackage(name: string) {
  return landingPackages.find(item => item.name === name);
}
