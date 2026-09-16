export default function Login() {
  return (
    <div className="page">
      <h1>Log in</h1>
      <p>Sign in with GitHub to access your capsule dashboard.</p>
      <a className="btn" href="/auth/github">Login with GitHub</a>
    </div>
  );
}
