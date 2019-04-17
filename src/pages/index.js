
import React from 'react';
import { css } from '@emotion/core';

import Layout from '../components/layout';
import SEO from '../components/seo';

const IndexPage = () => (
  <Layout>
    <SEO />
    <div css={css`
      text-align: center;
    `}>
      <p>
        I never remember having made such a choice -
        this life, it has chosen me.
      </p>
    </div>
  </Layout>
);

export default IndexPage;
