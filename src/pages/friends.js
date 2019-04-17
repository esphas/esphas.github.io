
import React from 'react';
import { css } from '@emotion/core';

import Layout from '../components/layout';
import SEO from '../components/seo';

const Friend = ({ name, link }) => (
  <li css={css`
    margin: 8px;
  `}>
    <p><a href={link}>{name}</a></p>
  </li>
);

const FriendsPage = () => (
  <Layout>
    <SEO
      title="Friends"
    />
    <ul css={css`
      list-style: none;
      margin-left: 0;
      display: flex;
    `}>
      <Friend
        name="taroxd"
        link="https://taroxd.github.io/"
      />
      <Friend
        name="hyrious"
        link="https://hyrious.me/"
      />
      <Friend
        name="invwindy"
        link="http://cirno.mist.so/"
      />
    </ul>
  </Layout>
);

export default FriendsPage;
