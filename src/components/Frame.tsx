"use client";

import { useEffect, useCallback, useState, useMemo } from "react";
import sdk, {
  AddFrame,
  SignIn as SignInCore,
  type Context,
} from "@farcaster/frame-sdk";

import { PurpleButton } from "~/components/ui/PurpleButton";
import { truncateAddress } from "~/lib/truncateAddress";
import { base, optimism } from "wagmi/chains";
import { useSession } from "next-auth/react";
import { createStore } from "mipd";
import { Label } from "~/components/ui/label";
import { PROJECT_TITLE } from "~/lib/constants";

interface FrameProps {
  title?: string;
}

export default function Frame({ title = PROJECT_TITLE }: FrameProps) {
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [context, setContext] = useState<Context.FrameContext>();

  const [added, setAdded] = useState(false);

  // Removed unused state
  const [trendingTags, setTrendingTags] = useState<{
    daily: string[];
    weekly: string[];
    monthly: string[];
  }>({ daily: [], weekly: [], monthly: [] });

  // Fetch trending cash tags
  useEffect(() => {
    const fetchTrendingTags = async () => {
      try {
        const response = await fetch('/api/trending-tags');
        const data = await response.json();
        setTrendingTags({
          daily: data.daily.slice(0, 5),
          weekly: data.weekly.slice(0, 5),
          monthly: data.monthly.slice(0, 5)
        });
      } catch (error) {
        console.error('Error fetching trending tags:', error);
      }
    };

    fetchTrendingTags();
  }, []);

  const addFrame = useCallback(async () => {
    try {
      await sdk.actions.addFrame();
    } catch (error) {
      if (error instanceof AddFrame.RejectedByUser) {
        setAddFrameResult(`Not added: ${error.message}`);
      }

      if (error instanceof AddFrame.InvalidDomainManifest) {
        setAddFrameResult(`Not added: ${error.message}`);
      }

      setAddFrameResult(`Error: ${error}`);
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      const context = await sdk.context;
      if (!context) {
        return;
      }

      setContext(context);
      setAdded(context.client.added);

      // If frame isn't already added, prompt user to add it
      if (!context.client.added) {
        addFrame();
      }

      sdk.on("frameAdded", ({ notificationDetails }) => {
        setAdded(true);
      });

      sdk.on("frameAddRejected", ({ reason }) => {
        console.log("frameAddRejected", reason);
      });

      sdk.on("frameRemoved", () => {
        console.log("frameRemoved");
        setAdded(false);
      });

      sdk.on("notificationsEnabled", ({ notificationDetails }) => {
        console.log("notificationsEnabled", notificationDetails);
      });
      sdk.on("notificationsDisabled", () => {
        console.log("notificationsDisabled");
      });

      sdk.on("primaryButtonClicked", () => {
        console.log("primaryButtonClicked");
      });

      console.log("Calling ready");
      sdk.actions.ready({});

      // Set up a MIPD Store, and request Providers.
      const store = createStore();

      // Subscribe to the MIPD Store.
      store.subscribe((providerDetails) => {
        console.log("PROVIDER DETAILS", providerDetails);
        // => [EIP6963ProviderDetail, EIP6963ProviderDetail, ...]
      });
    };
    if (sdk && !isSDKLoaded) {
      console.log("Calling load");
      setIsSDKLoaded(true);
      load();
      return () => {
        sdk.removeAllListeners();
      };
    }
  }, [isSDKLoaded, addFrame]);

  if (!isSDKLoaded) {
    return <div>Loading...</div>;
  }

  return (
    <div
      style={{
        paddingTop: context?.client.safeAreaInsets?.top ?? 0,
        paddingBottom: context?.client.safeAreaInsets?.bottom ?? 0,
        paddingLeft: context?.client.safeAreaInsets?.left ?? 0,
        paddingRight: context?.client.safeAreaInsets?.right ?? 0,
      }}
    >
      <div className="w-[300px] mx-auto py-2 px-2">
        <h1 className="text-2xl font-bold text-center mb-4">CashFrameTrends</h1>
        
        <div className="space-y-4">
          <div>
            <h2 className="font-bold mb-2">Top 5 Cash Tags (24h)</h2>
            <div className="space-y-1">
              {trendingTags.daily.map((tag, i) => (
                <div key={tag} className="flex items-center gap-2">
                  <span className="text-neutral-500">#{i + 1}</span>
                  <span className="font-mono">{tag}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="font-bold mb-2">Top 5 Cash Tags (7d)</h2>
            <div className="space-y-1">
              {trendingTags.weekly.map((tag, i) => (
                <div key={tag} className="flex items-center gap-2">
                  <span className="text-neutral-500">#{i + 1}</span>
                  <span className="font-mono">{tag}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="font-bold mb-2">Top 5 Cash Tags (30d)</h2>
            <div className="space-y-1">
              {trendingTags.monthly.map((tag, i) => (
                <div key={tag} className="flex items-center gap-2">
                  <span className="text-neutral-500">#{i + 1}</span>
                  <span className="font-mono">{tag}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
