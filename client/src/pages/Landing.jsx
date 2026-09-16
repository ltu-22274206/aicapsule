import { Link } from "react-router-dom";

export default function Landing() {
  return (
    <div className="page">
      <h1>AI Capsule</h1>
      <p>
        A private prompt library. Save the AI prompts you actually use for coding,
        writing and study - project, version, whether it worked, and what you'd
        improve next time - so good prompts stop getting lost in chat history.
      </p>
      <Link className="btn" to="/login">Get started</Link>
    </div>
  );
}
