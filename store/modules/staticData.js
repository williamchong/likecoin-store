/* eslint no-shadow: "off" */
/* eslint no-param-reassign: "off" */
import Vue from 'vue'; // eslint-disable-line import/no-extraneous-dependencies

import {
  STATIC_DATA_SET_LIKECOIN_USD_NUMERIC_PRICE,
  STATIC_DATA_SET_LIKE_STAT,
  STATIC_DATA_SET_LIKE_SUGGEST_LIST,
  STATIC_DATA_SET_LIKE_SUGGEST_DETAIL,
  STATIC_DATA_SET_USER_MIN_INFO,
} from '../mutation-types';
import * as getters from './getters/staticData';
import * as actions from './actions/staticData';

const state = {
  likeCoinUsdNumericPrice: 0,
  LIKEStat: {},
  suggestedArticle: {},
  userInfos: {},
};

const mutations = {
  [STATIC_DATA_SET_LIKECOIN_USD_NUMERIC_PRICE](state, payload) {
    state.likeCoinUsdNumericPrice = payload;
  },
  [STATIC_DATA_SET_LIKE_STAT](state, payload) {
    state.LIKEStat = payload;
  },
  [STATIC_DATA_SET_LIKE_SUGGEST_LIST](state, { editorial = [], personal = [], mostLike = [] }) {
    const output = {};
    const list = editorial.concat(personal).concat(mostLike);
    list.forEach((url) => {
      output[url] = { url };
    });
    state.suggestedArticle = output;
  },
  [STATIC_DATA_SET_LIKE_SUGGEST_DETAIL](state, { url, info }) {
    if (state.suggestedArticle[url]) {
      if (info) {
        Vue.set(state.suggestedArticle, url, { url, ...info });
      } else {
        // remove article with incorrect referrer url from suggestion list
        Vue.delete(state.suggestedArticle, url);
      }
    }
  },
  [STATIC_DATA_SET_USER_MIN_INFO](state, { id, displayName, avatar }) {
    Vue.set(state.userInfos, id, { displayName, avatar });
  },
};

export default {
  actions,
  getters,
  state,
  mutations,
};
