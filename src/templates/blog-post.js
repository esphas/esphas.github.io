import React from 'react';
import { Link, graphql } from 'gatsby';
import { css } from '@emotion/core';

import SEO from '../components/seo';
import Layout from '../components/layout';

const PostPage = ({ pageContext, data }) => {
  const post = data.markdownRemark;
  return (
    <Layout>
      <SEO
        title={post.frontmatter.title}
        description={post.frontmatter.description || post.excerpt}
        article={true}
      />
      <article>
        <h1>{ post.frontmatter.title }</h1>
        <div dangerouslySetInnerHTML={{ __html: post.html }} />
      </article>
      <div css={css`
        display: flex;
        justify-content: space-between;
      `}>
        <span>
          {pageContext.previous && (
            <Link to={pageContext.previous.fields.slug}>&lt;Previous</Link>
          )}
        </span>
        <span>
          {pageContext.next && (
            <Link to={pageContext.next.fields.slug}>Next&gt;</Link>
          )}
        </span>
      </div>
    </Layout>
  );
};

export default PostPage;

export const query = graphql`
  query($slug: String!) {
    markdownRemark(fields: { slug: { eq: $slug } }) {
      html
      frontmatter {
        title
      }
    }
  }
`;
