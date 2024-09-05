import { LitNodeClient } from '@lit-protocol/lit-node-client';
import { LitNetwork } from '@lit-protocol/constants';
import { LitContracts } from '@lit-protocol/contracts-sdk';

export const connectToLitNodes = async () => {
    const litNodeClient = new LitNodeClient({
        litNetwork: LitNetwork.DatilDev,
        debug: false,
      });
    await litNodeClient.connect();
    return litNodeClient;
};

export const connectToLitContracts = async () => {
    const litContracts = new LitContracts({
        network: LitNetwork.DatilDev,
    });
    await litContracts.connect();
    return litContracts;
};
