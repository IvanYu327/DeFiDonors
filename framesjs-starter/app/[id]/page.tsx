import { ClientProtocolId } from "frames.js";
import {
  FrameButton,
  FrameContainer,
  FrameImage,
  FrameInput,
  FrameReducer,
  NextServerPageProps,
  getFrameMessage,
  getPreviousFrame,
  useFramesReducer,
} from "frames.js/next/server";
import Link from "next/link";
import { DEFAULT_DEBUGGER_HUB_URL, createDebugUrl } from "../debug";
import { currentURL } from "../utils";

import { initializeApp } from "firebase/app";
import { get, getDatabase, ref } from "firebase/database";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDeiitajd2hd8VK1O_LQbxnC9ivFrNEAjs",
  authDomain: "defi-donors.firebaseapp.com",
  projectId: "defi-donors",
  storageBucket: "defi-donors.appspot.com",
  messagingSenderId: "993271436077",
  appId: "1:993271436077:web:8e5dad32ec7f87638779a4",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase();

type State = {
  title: string;
  description: string;
  raised: number;
  goal: number;
  days_left: number;
};

const acceptedProtocols: ClientProtocolId[] = [
  {
    id: "xmtp",
    version: "vNext",
  },
  {
    id: "farcaster",
    version: "vNext",
  },
];

const reducer: FrameReducer<State> = (state, action) => {
  return {
    ...state, // Spread the existing state
    // total_button_presses: state.total_button_presses + 1,
    // active: action.postBody?.untrustedData.buttonIndex
    //   ? String(action.postBody?.untrustedData.buttonIndex)
    //   : "1",
  };
};

interface HomeProps {
  params: { id: string };
  searchParams: NextServerPageProps["searchParams"];
}

// This is a react server component only
export default async function Home({ params, searchParams }: HomeProps) {
  const url = currentURL("/");
  const previousFrame = getPreviousFrame<State>(searchParams);
  const dbRef = ref(database, params.id);
  const snapshot = await get(dbRef);
  if (!snapshot.exists()) {
    throw new Error("No data available");
  }

  const initialState: State = snapshot.val();

  const frameMessage = await getFrameMessage(previousFrame.postBody, {
    hubHttpUrl: DEFAULT_DEBUGGER_HUB_URL,
  });

  if (frameMessage && !frameMessage?.isValid) {
    throw new Error("Invalid frame payload");
  }

  const [state, dispatch] = useFramesReducer<State>(
    reducer,
    initialState,
    previousFrame
  );

  // Here: do a server side side effect either sync or async (using await), such as minting an NFT if you want.
  // example: load the users credentials & check they have an NFT

  console.log("info: state is:", state);
  console.log("info: message is:", frameMessage);

  if (frameMessage?.transactionId) {
    return (
      <FrameContainer
        postUrl="/frames"
        pathname="/"
        state={state}
        previousFrame={previousFrame}
        accepts={acceptedProtocols}
      >
        <FrameImage aspectRatio="1.91:1">
          <div tw="flex">Transaction Received</div>
          <div tw="flex">{frameMessage?.transactionId}</div>
        </FrameImage>
      </FrameContainer>
    );
  }

  const percent = (state.raised / state.goal) * 100;
  const percent_string = percent.toFixed(2) + "%";

  // then, when done, return next frame
  return (
    <div className="p-4">
      frames.js starter kit. The Template Frame is on this page, it&apos;s in
      the html meta tags (inspect source).{" "}
      <Link href={createDebugUrl(url)} className="underline">
        Debug
      </Link>{" "}
      or see{" "}
      <Link href="/examples" className="underline">
        other examples
      </Link>
      <FrameContainer
        postUrl="/frames"
        pathname="/"
        state={state}
        previousFrame={previousFrame}
        accepts={acceptedProtocols}
      >
        {/* <FrameImage src="https://framesjs.org/og.png" /> */}
        <FrameImage aspectRatio="1.91:1">
          <div tw="w-full h-full bg-gray-200 flex flex-col">
            <div tw="bg-slate-700 text-white p-12 flex justify-between items-center">
              <div>Donate Now</div>
            </div>
            {/* Image, with title, and description to the right */}
            <div tw="flex flex-col w-95/100">
              <div tw="flex flex-row">
                <div tw="flex flex-row">
                  {/* <Image
                  src="/your-image.jpg"
                  alt="Your Image"
                  width={500}
                  height={500}
                /> */}
                  <div tw="flex bg-gray-300 w-64 h-64"></div>
                </div>
                <div tw="flex flex-col">
                  <h2>{state?.title}</h2>
                  <p>{state?.description}</p>
                </div>
              </div>
              {/* Progress bar */}
              <div tw="flex flex-col items-center">
                <div
                  style={{ background: "#D9D9D9" }}
                  tw="flex w-95/100 h-8 rounded-lg overflow-hidden"
                >
                  <div
                    tw="h-full"
                    style={{ background: "#285FCD", width: percent_string }}
                  ></div>
                  {/* Adjust width dynamically */}
                </div>
                {/* Progress bar info */}
                <div tw="flex w-95/100 h-16 justify-between">
                  <div tw="flex">
                    <span tw="pr-2">${state?.raised}</span>
                    of ${state?.goal} raised
                  </div>
                  <div tw="flex">{state?.days_left} days left</div>
                </div>
              </div>
            </div>
          </div>
        </FrameImage>
        <FrameInput text="put some text here" />
        <FrameButton>
          {state?.active === "1" ? "Active" : "Inactive"}
        </FrameButton>
        <FrameButton>
          {state?.active === "2" ? "Active" : "Inactive"}
        </FrameButton>
        <FrameButton action="link" target={`https://www.google.com`}>
          External
        </FrameButton>
        <FrameButton
          action="tx"
          target="http://localhost:3000/txtarget"
          post_url="http://localhost:3000/frames"
        >
          Pay
        </FrameButton>
      </FrameContainer>
    </div>
  );
}