import Head from 'next/head';
import { useRouter } from 'next/router';
import LoginForm from '../../components/auth/LoginForm';

export default function LoginPage() {
  const router = useRouter();
  const email = typeof router.query.email === 'string' ? router.query.email : '';

  return (
    <>
      <Head>
        <title>Log in</title>
      </Head>
      <main className="max-w-md mx-auto p-6 space-y-6">
        <h1 className="text-2xl font-bold">Log in</h1>
        {/* key re-mounts the form once the query (e.g. ?email=) is available */}
        <LoginForm key={email} initialEmail={email} />
      </main>
    </>
  );
}
