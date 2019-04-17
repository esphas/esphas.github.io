
import React from 'react';
import { Link, graphql } from 'gatsby';
import { css } from '@emotion/core';

import Layout from '../components/layout';
import SEO from '../components/seo';

const BlogPage = ({ data }) => (
  <Layout>
    <SEO
      title="Blog"
    />
    {data.allMarkdownRemark.edges.map(({ node }) => (
      <div key={node.fields.slug} css={css`
        display: flex;
        align-items: baseline;
        transition: background 200ms;
        &:hover {
          background: lightgrey;
        }
      `}>
        <Link to={node.fields.slug} css={css`
          flex-grow: 1;
        `}>
          <h4 css={css`
            margin: 0;
          `}>{node.frontmatter.title}</h4>
        </Link>
        <span>{node.frontmatter.date}</span>
      </div>
    ))}
  </Layout>
);

export default BlogPage;

export const query = graphql`
  query {
    allMarkdownRemark(sort: { fields: [frontmatter___date], order: DESC }) {
      edges {
        node {
          excerpt
          fields {
            slug
          }
          frontmatter {
            title
            date(formatString: "YYYY-MM-DD")
          }
        }
      }
    }
  }
`;
