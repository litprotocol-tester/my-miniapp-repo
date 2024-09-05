import { LitNodeClient } from '@lit-protocol/lit-node-client';
import { LitNetwork } from '@lit-protocol/constants';
import { LitContracts } from '@lit-protocol/contracts-sdk';
import * as ethers from 'ethers';
import {
    LitAbility,
    LitAccessControlConditionResource,
    createSiweMessage,
    generateAuthSig,
  } from "@lit-protocol/auth-helpers";

export const connectToLitNodes = async () => {
    const litNodeClient = new LitNodeClient({
        litNetwork: LitNetwork.DatilDev,
        debug: false,
      });
    await litNodeClient.connect();
    return litNodeClient;
};

export const connectToLitContracts = async (provider: any) => {
    const ethersProvider = new ethers.providers.Web3Provider(provider as any);
    await provider.send("eth_requestAccounts", []);
    const newSigner = ethersProvider.getSigner();
    const litContracts = new LitContracts({
        signer: newSigner,
        network: LitNetwork.DatilDev,
    });
    await litContracts.connect();
    return litContracts;
};

export const getSessionSignatures = async (litNodeClient: LitNodeClient, provider: any) => {
    const ethersProvider = new ethers.providers.Web3Provider(provider as any);
    await provider.send("eth_requestAccounts", []);
    const ethersSigner = ethersProvider.getSigner();
    const sessionSignatures = await litNodeClient.getSessionSigs({
        chain: "ethereum",
        expiration: new Date(Date.now() + 1000 * 60 * 10).toISOString(), // 10 minutes
        resourceAbilityRequests: [
        {
            resource: new LitAccessControlConditionResource("*"),
            ability: LitAbility.AccessControlConditionDecryption,
        },
        ],
        authNeededCallback: async ({
        uri,
        expiration,
        resourceAbilityRequests,
        }) => {
        const toSign = await createSiweMessage({
            uri,
            expiration,
            resources: resourceAbilityRequests,
            walletAddress: await ethersSigner.getAddress(),
            nonce: await litNodeClient.getLatestBlockhash(),
            litNodeClient,
        });

        return await generateAuthSig({
            signer: ethersSigner,
            toSign,
        });
        },
    });
    console.log("✅ Got Session Sigs via an Auth Sig");
    return sessionSignatures;
};