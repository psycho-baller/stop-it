import { AllPosts } from "./AllPosts";
import { SignInOrComposer } from "./SignInOrComposer";
import WebCam from "./WebCam";

export default function Home() {
  return (
    <main>
      <SignInOrComposer />
      <AllPosts />
      <WebCam />
    </main>
  );
}
