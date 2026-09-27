'use client';

import { create, type UseState } from '@ilokesto/state/react';
import { useState } from 'react';

import {
  DemoFrame,
  type DemoProps,
  demoButtonClass,
  demoSecondaryButtonClass,
} from './demo-frame';

type CounterState = { count: number };
type CounterHook = UseState<CounterState>;

const selectCount = (state: Readonly<CounterState>) => state.count;
const selectIsEven = (state: Readonly<CounterState>) => state.count % 2 === 0;

const code = `const useCounter = create({ count: 0 });

function CountView() {
  const [count] = useCounter(state => state.count);
  return <output>{count}</output>;
}

function StatusView() {
  const [isEven] = useCounter(state => state.count % 2 === 0);
  return <output>{isEven ? 'Even' : 'Odd'}</output>;
}

const setCounter = useCounter.writeOnly();
setCounter(state => ({ count: state.count + 1 }));`;

function CountView({ useCounter, label }: { useCounter: CounterHook; label: string }) {
  const [count] = useCounter(selectCount);

  return (
    <div className="rounded-xl border border-fd-border bg-fd-card p-4">
      <p className="text-xs font-medium text-fd-muted-foreground">{label}</p>
      <output
        data-demo-result="state-count"
        aria-live="polite"
        className="mt-2 block font-mono text-3xl font-semibold tabular-nums text-fd-foreground"
      >
        {count}
      </output>
    </div>
  );
}

function StatusView({ useCounter, label, even, odd }: {
  useCounter: CounterHook;
  label: string;
  even: string;
  odd: string;
}) {
  const [isEven] = useCounter(selectIsEven);

  return (
    <div className="rounded-xl border border-fd-border bg-fd-card p-4">
      <p className="text-xs font-medium text-fd-muted-foreground">{label}</p>
      <output
        data-demo-result="state-parity"
        aria-live="polite"
        className="mt-2 block text-lg font-semibold text-fd-foreground"
      >
        {isEven ? even : odd}
      </output>
    </div>
  );
}

export function StateDemo({ lang }: DemoProps) {
  const [useCounter] = useState(() => create<CounterState>({ count: 0 }));
  const setCounter = useCounter.writeOnly();

  const copy = lang === 'ko'
    ? {
        title: '하나의 상태, 두 개의 뷰',
        description: '각 뷰는 같은 상태에서 필요한 값만 선택합니다. 한 번의 변경이 두 선택 결과를 함께 갱신합니다.',
        countView: '숫자 선택 뷰',
        statusView: '홀짝 선택 뷰',
        even: '짝수',
        odd: '홀수',
        increment: '카운트 늘리기',
        reset: '초기화',
      }
    : {
        title: 'One state, two views',
        description: 'Each view selects only what it needs from shared state. One update refreshes both selections.',
        countView: 'Count selector view',
        statusView: 'Parity selector view',
        even: 'Even',
        odd: 'Odd',
        increment: 'Increment count',
        reset: 'Reset',
      };

  return (
    <DemoFrame
      lang={lang}
      name="state"
      title={copy.title}
      description={copy.description}
      code={code}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <CountView useCounter={useCounter} label={copy.countView} />
        <StatusView
          useCounter={useCounter}
          label={copy.statusView}
          even={copy.even}
          odd={copy.odd}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          data-demo-action="state-increment"
          className={demoButtonClass}
          onClick={() => setCounter(state => ({ count: state.count + 1 }))}
        >
          {copy.increment}
        </button>
        <button
          type="button"
          data-demo-action="state-reset"
          className={demoSecondaryButtonClass}
          onClick={() => setCounter({ count: 0 })}
        >
          {copy.reset}
        </button>
      </div>
    </DemoFrame>
  );
}
