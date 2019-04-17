
import React from 'react';
import { css } from '@emotion/core';

import Layout from '../components/layout';
import SEO from '../components/seo';

const AboutPage = () => (
  <Layout>
    <SEO
      title="About"
    />
    <div css={css`
      display: flex;
      flex-wrap: wrap;
    `}>
      <div>
        <h2>关于本站</h2>
        <p>Momokoi，桃恋。</p>
        <p>记录有关游戏、生活、编程及任何其他无用之事的想法。</p>
      </div>
      <div>
        <h2>关于我</h2>
        <p>Esphas，余烬。玩家，百科爱好者。</p>
      </div>
    </div>
  </Layout>
);

export default AboutPage;
