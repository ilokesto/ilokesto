'use client';

import { CreateForm, type StandardSchemaV1 } from '@ilokesto/form';
import { useForm } from '@ilokesto/form/react';
import { useId, useState } from 'react';

import {
  DemoFrame,
  type DemoProps,
  demoButtonClass,
  demoInputClass,
  demoSecondaryButtonClass,
} from './demo-frame';

type FormValues = { email: string };

const emailSchema: StandardSchemaV1<unknown, FormValues> = {
  '~standard': {
    version: 1,
    vendor: 'ilokesto-docs',
    validate(value) {
      if (typeof value !== 'object' || value === null || !('email' in value)) {
        return { issues: [{ message: 'invalid_email', path: ['email'] }] };
      }

      const email = value.email;
      return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
        ? { value: { email } }
        : { issues: [{ message: 'invalid_email', path: ['email'] }] };
    },
  },
};

const code = `import { CreateForm, type StandardSchemaV1 } from '@ilokesto/form';
import { useForm } from '@ilokesto/form/react';
import { useState } from 'react';

const emailSchema: StandardSchemaV1<unknown, { email: string }> = {
  '~standard': {
    version: 1,
    vendor: 'email-example',
    validate(value) {
      if (typeof value !== 'object' || value === null || !('email' in value)) {
        return { issues: [{ message: 'Invalid email', path: ['email'] }] };
      }
      const email = value.email;
      return typeof email === 'string' && /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email)
        ? { value: { email } }
        : { issues: [{ message: 'Invalid email', path: ['email'] }] };
    },
  },
};

function EmailForm() {
  const [form] = useState(() => new CreateForm({
    defaultValues: { email: '' },
    schema: emailSchema,
    validateOn: ['submit'],
  }));
  const [result, setResult] = useState('');
  const { form: controller, handleSubmit, useField } = useForm(form);
  const email = useField({ name: 'email', type: 'email' });

  return (
    <form noValidate onSubmit={handleSubmit(values => setResult(values.email))}>
      <input {...email.props} />
      {email.errors[0] && <p role="alert">{email.errors[0].message}</p>}
      <button type="submit">Submit</button>
      <button type="button" onClick={() => {
        controller.reset();
        setResult('');
      }}>Reset</button>
      <output>{result}</output>
    </form>
  );
}`;

export function FormDemo({ lang }: DemoProps) {
  const copy = lang === 'ko'
    ? {
        title: '제출할 때 검증하는 이메일 폼',
        description: '이메일을 입력하고 제출해 보세요. Form이 값을 관리하고, 검증을 통과한 값만 결과에 표시합니다.',
        label: '이메일 주소',
        placeholder: 'hello@example.com',
        invalid: '올바른 이메일 주소를 입력해 주세요.',
        submit: '이메일 확인',
        reset: '초기화',
        success: (email: string) => `${email} 주소를 사용할 수 있습니다.`,
        attempts: (count: number) => `제출 횟수: ${count}`,
      }
    : {
        title: 'An email form that validates on submit',
        description: 'Enter an email and submit it. Form owns the value and only shows a result after validation passes.',
        label: 'Email address',
        placeholder: 'hello@example.com',
        invalid: 'Enter a valid email address.',
        submit: 'Check email',
        reset: 'Reset',
        success: (email: string) => `${email} is ready to use.`,
        attempts: (count: number) => `Submit attempts: ${count}`,
      };
  const [form] = useState(() => new CreateForm<FormValues>({
    defaultValues: { email: '' },
    schema: emailSchema,
    validateOn: ['submit'],
  }));
  const [result, setResult] = useState<string | null>(null);
  const { form: controller, handleSubmit, useField, useFormState } = useForm(form);
  const email = useField({ name: 'email', type: 'email' });
  const state = useFormState();
  const inputId = useId();
  const errorId = `${inputId}-error`;

  const reset = () => {
    controller.reset();
    setResult(null);
  };

  return (
    <DemoFrame
      lang={lang}
      name="form"
      title={copy.title}
      description={copy.description}
      code={code}
    >
      <form
        className="space-y-4"
        noValidate
        onSubmit={handleSubmit(
          values => setResult(copy.success(values.email)),
          () => setResult(null),
        )}
      >
        <div className="space-y-2">
          <label htmlFor={inputId} className="block text-sm font-medium text-fd-foreground">
            {copy.label}
          </label>
          <input
            {...email.props}
            id={inputId}
            data-demo-input="form-email"
            className={demoInputClass}
            placeholder={copy.placeholder}
            autoComplete="email"
            aria-invalid={email.errors.length > 0}
            aria-describedby={email.errors.length > 0 ? errorId : undefined}
          />
          {email.errors[0] ? (
            <p id={errorId} data-demo-result="form-error" role="alert" className="text-sm text-red-600 dark:text-red-400">
              {copy.invalid}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            data-demo-action="form-submit"
            className={demoButtonClass}
            disabled={state.isSubmitting}
          >
            {copy.submit}
          </button>
          <button
            type="button"
            data-demo-action="form-reset"
            className={demoSecondaryButtonClass}
            onClick={reset}
          >
            {copy.reset}
          </button>
        </div>
        <p data-demo-result="form-submit-count" className="text-xs text-fd-muted-foreground">
          {copy.attempts(state.submitCount)}
        </p>
        <div className="min-h-12 rounded-xl border border-fd-border bg-fd-card px-4 py-3">
          <p data-demo-result="form-success" role="status" aria-live="polite" className="text-sm font-medium text-fd-foreground">
            {result ?? ''}
          </p>
        </div>
      </form>
    </DemoFrame>
  );
}
