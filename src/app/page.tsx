import Uploader from "@/components/app-content/uploader";

export default function Home() {
  return (
    <div className={"w-full h-screen absolute"}>
      <div className={"w-full h-[100dvh] p-8 bottom-0 absolute"}>
        <Uploader />
      </div>
    </div>
  );
}
