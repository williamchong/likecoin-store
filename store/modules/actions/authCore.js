import { AuthCoreAuthClient } from 'authcore-js';
import * as types from '@/store/mutation-types';
import { AUTHCORE_API_HOST } from '@/constant';

const { AuthcoreVaultClient, AuthcoreCosmosProvider } = require('secretd-js');

export async function fetchAuthCoreAccessTokenAndUser(context, code) {
  const authClient = await new AuthCoreAuthClient({
    apiBaseURL: AUTHCORE_API_HOST,
  });
  const token = await authClient.createAccessToken(code);
  await authClient.setAccessToken(token.access_token);
  const currentUser = await authClient.getCurrentUser;
  const { access_token: accessToken, id_token: idToken } = token;
  return { accessToken, currentUser, idToken };
}

export async function setAuthCoreToken({ commit, state, dispatch }, accessToken) {
  commit(types.AUTHCORE_SET_ACCESS_TOKEN, accessToken);
  if (accessToken) {
    if (window.localStorage) window.localStorage.setItem('authcore.accessToken', accessToken);
    if (state.authClient) {
      state.authClient.setAccessToken(accessToken);
    } else {
      await dispatch('initAuthCoreClient');
    }
    await dispatch('initAuthCoreWalletService');
    await dispatch('fetchAuthCoreOAuthFactors');
  } else {
    if (window.localStorage) window.localStorage.removeItem('authcore.accessToken');
    await dispatch('clearAuthCoreAllClients');
  }
}

export async function authCoreLogoutUser({ state, dispatch }) {
  if (state.authClient) {
    try {
      await state.authClient.signOut();
    } catch (err) {
      console.error(err);
    }
  }
  await dispatch('setAuthCoreToken', '');
}

export async function initAuthCoreClient({ commit, state, dispatch }) {
  const { accessToken } = state;
  const authClient = await new AuthCoreAuthClient({
    apiBaseURL: AUTHCORE_API_HOST,
    callbacks: {
      unauthenticated: () => {
        dispatch('setAuthCoreToken', '');
      },
    },
    accessToken,
  });
  commit(types.AUTHCORE_SET_AUTH_CLIENT, authClient);
}

export async function initAuthCoreWalletService({ commit, state }) {
  const keyVaultClient = await new AuthcoreVaultClient({
    apiBaseURL: AUTHCORE_API_HOST,
    accessToken: state.accessToken,
  });
  const walletSubprovider = await new AuthcoreCosmosProvider({
    client: keyVaultClient,
  });
  commit(types.AUTHCORE_SET_KV_CLIENT, keyVaultClient);
  commit(types.AUTHCORE_SET_COSMOS_PROVIDER, walletSubprovider);
}

export async function initAuthCoreCosmosWallet({ state, dispatch }) {
  let { kvClient, cosmosProvider } = state;
  try {
    if (!kvClient || !cosmosProvider) await dispatch('initAuthCoreWalletService');
    ({ kvClient, cosmosProvider } = state);
    const [cosmosAddress] = await cosmosProvider.getAddresses();
    return cosmosAddress;
  } catch (err) {
    console.error(err);
  }
  return '';
}

export async function clearAuthCoreAllClients({ commit }) {
  commit(types.AUTHCORE_SET_AUTH_CLIENT, null);
  commit(types.AUTHCORE_SET_KV_CLIENT, null);
  commit(types.AUTHCORE_SET_COSMOS_PROVIDER, null);
  commit(types.AUTHCORE_SET_OAUTH_FACTORS, null);
}

export async function fetchAuthCoreOAuthFactors({ state, commit }) {
  const platforms = await state.authClient.listOAuthFactors();
  commit(types.AUTHCORE_SET_OAUTH_FACTORS, platforms);
}

export async function fetchAuthCoreCosmosWallet({ state }) {
  if (!state.cosmosProvider) return null;
  const [cosmosAddress] = await state.cosmosProvider.getAddresses();
  return cosmosAddress;
}

export async function prepareCosmosTxSigner({ state }) {
  if (!state.cosmosProvider) throw new Error('COSMOS_WALLET_NOT_INITED');
  const [address] = await state.cosmosProvider.getAddresses(); // HACK: only get first wallet
  return async function signer(signMessage) {
    const data = JSON.parse(signMessage);
    const dataWithSign = await state.cosmosProvider.approve(data, address);
    const signObject = dataWithSign.signatures[dataWithSign.signatures.length - 1];
    return {
      signature: Buffer.from(signObject.signature, 'base64'),
      publicKey: Buffer.from(signObject.pub_key.value, 'base64'),
    };
  };
}
