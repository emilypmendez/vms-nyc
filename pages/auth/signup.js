import Head from 'next/head';
import SignupForm from '../../components/auth/SignupForm';

export default function SignupPage() {
  return (
    <>
      <Head>
        <title>Sign up</title>
      </Head>
      <main className="max-w-lg mx-auto p-6 space-y-6">
        <h1 className="text-2xl font-bold">Create an account</h1>
        <SignupForm />
      </main>
    </>
  );
}
