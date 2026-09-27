import { Blocks, Braces, Layers3 } from 'lucide-react';

export type Locale = 'en' | 'ko';
export type PackageName =
  | 'store'
  | 'state'
  | 'form'
  | 'overlay'
  | 'modal'
  | 'toast'
  | 'utilinent'
  | 'fetcher';

export type PackageCard = {
  readonly pkg: PackageName;
  readonly descriptions: Record<Locale, string>;
  readonly support: Record<Locale, string>;
  readonly beta?: boolean;
};

export const packageCards: readonly PackageCard[] = [
  {
    pkg: 'store',
    descriptions: {
      en: 'A small framework-neutral state container with synchronous reads and selector subscriptions.',
      ko: '동기식 읽기와 선택 구독을 제공하는 작은 프레임워크 독립 상태 컨테이너.',
    },
    support: { en: 'Framework-neutral', ko: '프레임워크 독립' },
  },
  {
    pkg: 'state',
    descriptions: {
      en: 'Framework adapters, reducers, middleware, and utilities built on the same store model.',
      ko: '같은 상태 모델에 프레임워크 어댑터, 리듀서, 미들웨어와 유틸리티를 더합니다.',
    },
    support: {
      en: 'Vanilla · React · Vue · Angular · Svelte · Solid',
      ko: 'Vanilla · React · Vue · Angular · Svelte · Solid',
    },
  },
  {
    pkg: 'form',
    descriptions: {
      en: 'Headless form state, validation flow, field metadata, and bindings for four UI frameworks.',
      ko: '화면 구성은 자유롭게, 폼 상태와 검증은 일관되게. 네 가지 UI 프레임워크를 지원합니다.',
    },
    support: {
      en: 'Vanilla · React · Vue · Svelte · Solid',
      ko: 'Vanilla · React · Vue · Svelte · Solid',
    },
  },
  {
    pkg: 'overlay',
    descriptions: {
      en: 'A provider-scoped React runtime for custom modals, toasts, sheets, and layered UI.',
      ko: '모달, 토스트, 시트 등 화면 위에 겹쳐 띄우는 UI를 위한 React 런타임.',
    },
    support: { en: 'React', ko: 'React' },
  },
  {
    pkg: 'modal',
    descriptions: {
      en: 'A pre-built modal system using Overlay’s shared lifecycle and adapter model.',
      ko: 'Overlay의 공통 수명 주기와 어댑터 모델을 사용하는 모달 시스템.',
    },
    support: { en: 'React', ko: 'React' },
  },
  {
    pkg: 'toast',
    descriptions: {
      en: 'Toast notifications with motion, positioning, and auto-dismiss semantics.',
      ko: '애니메이션, 위치 지정과 자동 닫기를 지원하는 토스트 알림.',
    },
    support: { en: 'React', ko: 'React' },
  },
  {
    pkg: 'utilinent',
    descriptions: {
      en: 'Composable React utilities for conditionals, lists, async states, slots, and lazy UI.',
      ko: '조건부 렌더링, 목록, 비동기 상태, 슬롯과 지연 로딩을 위한 React 유틸리티.',
    },
    support: { en: 'React', ko: 'React' },
  },
  {
    pkg: 'fetcher',
    descriptions: {
      en: 'An OpenAPI-aware ky wrapper with typed routes, inferred responses, and errors as results. Available in beta.',
      ko: '경로 타입 검사와 응답 추론, 오류를 결과로 다루는 API를 더한 ky 래퍼. 베타 버전으로 제공됩니다.',
    },
    support: { en: 'Framework-neutral', ko: '프레임워크 독립' },
    beta: true,
  },
];

export const packageGroups = [
  { id: 'state', packages: ['store', 'state', 'form'], icon: Blocks },
  { id: 'layers', packages: ['overlay', 'modal', 'toast'], icon: Layers3 },
  { id: 'utilities', packages: ['utilinent', 'fetcher'], icon: Braces },
] as const;

export const homeCopy = {
  en: {
    eyebrow: 'Small tools. Explicit contracts.',
    title: 'Build predictable front ends, one focused package at a time.',
    subtitle:
      'ilokesto means “toolbox” in Esperanto. Choose only the state, forms, layered UI, rendering, or HTTP tools your product needs.',
    browse: 'Choose a package',
    beta: 'Beta',
    support: 'Support',
    packagesEyebrow: 'The toolbox',
    packagesTitle: 'Start with what you are building.',
    packagesBody:
      'Each package has one job. Use the groups and comparisons below to find the smallest useful starting point.',
    groups: {
      state: {
        title: 'State and input',
        description: 'Own application values, connect them to a framework, or manage form interaction.',
      },
      layers: {
        title: 'Layered interface',
        description: 'Build a custom overlay runtime or choose a focused modal or toast system.',
      },
      utilities: {
        title: 'Standalone rendering and data',
        description:
          'Choose React rendering utilities or an OpenAPI-aware ky client without adding another ilokesto package.',
      },
    },
    packageExplore: 'Explore package',
    packageQuickStart: 'Quick start',
    chooseEyebrow: 'Two useful distinctions',
    chooseTitle: 'Choose the right level of abstraction.',
    choices: [
      {
        question: 'Store or State?',
        answer:
          'Choose Store for a framework-neutral value with direct reads and subscriptions. Choose State when you also need framework adapters, reducers, middleware, or state utilities.',
      },
      {
        question: 'Overlay or Modal / Toast?',
        answer:
          'Choose Overlay when you are defining custom layered UI and its adapters. Choose Modal or Toast when that interaction already matches the focused system you need.',
      },
    ],
  },
  ko: {
    eyebrow: '작은 도구, 명확한 동작',
    title: '필요한 도구만 골라 예측 가능한 프론트엔드를 만드세요.',
    subtitle:
      "ilokesto는 에스페란토로 '도구상자'라는 뜻입니다. 제품에 필요한 상태 관리, 폼, 오버레이, 렌더링, HTTP 도구만 선택할 수 있습니다.",
    browse: '패키지 선택하기',
    beta: '베타',
    support: '지원 환경',
    packagesEyebrow: '도구상자 살펴보기',
    packagesTitle: '지금 만들고 있는 것에서 시작하세요.',
    packagesBody:
      '각 패키지는 한 가지 역할에 집중합니다. 아래 분류와 비교를 보고 가장 작은 시작점을 찾으세요.',
    groups: {
      state: {
        title: '상태와 입력',
        description: '앱의 값을 관리하고, 프레임워크에 연결하거나 폼 입력과 검증을 다룹니다.',
      },
      layers: {
        title: '화면 위에 띄우는 UI',
        description: '나만의 오버레이를 만들거나 모달과 토스트 전용 패키지를 선택합니다.',
      },
      utilities: {
        title: '독립 렌더링과 데이터 도구',
        description:
          '다른 ilokesto 패키지 없이 React 렌더링 유틸리티나 OpenAPI를 지원하는 ky 클라이언트를 선택합니다.',
      }
    },
    packageExplore: '패키지 살펴보기',
    packageQuickStart: '빠른 시작',
    chooseEyebrow: '헷갈리기 쉬운 두 가지',
    chooseTitle: '필요한 추상화 수준을 선택하세요.',
    choices: [
      {
        question: 'Store와 State 중 무엇을 쓸까요?',
        answer:
          '프레임워크와 무관한 값, 직접 읽기와 구독만 필요하면 Store를 선택하세요. 프레임워크 어댑터, 리듀서, 미들웨어나 상태 유틸리티까지 필요하면 State가 알맞습니다.',
      },
      {
        question: 'Overlay와 Modal / Toast 중 무엇을 쓸까요?',
        answer:
          '오버레이의 동작과 어댑터를 직접 정의한다면 Overlay를 선택하세요. 모달이나 토스트가 필요하다면 해당 전용 패키지에서 시작하세요.',
      },
    ],
  },
} as const;
