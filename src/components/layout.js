
import React from 'react';
import { Helmet } from 'react-helmet';
import PropTypes from 'prop-types';
import { Link, StaticQuery, graphql } from 'gatsby';
import { css } from '@emotion/core';
import styled from '@emotion/styled';

import '../styles/global.css';

const Container = ({ children }) => (
  <div css={css`
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
  `}>
    <div css={css`
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100%;
    `}>
      <div css={css`
        display: flex;
        flex-direction: column;
        margin: 8px;
        padding: 8px;
        border: dashed steelblue 4px;
        width: 100%;
        @media (min-width: 800px) {
          width: 800px;
        }
      `}>
        { children }
      </div>
    </div>
  </div>
);

const Header = ({ children }) => (
  <header css={css`
    margin-bottom: 16px;
  `}>
    <nav css={css`
      width: 100%;
      height: 100%;
    `}>
      { children }
    </nav>
  </header>
);

const NavList = styled.ul`
  display: flex;
  margin: 0;
  padding: 0;
  list-style: none;
`;

const NavListItem = styled.li`
  margin: 0;
  padding: 8px;
  &:first-of-type {
    flex-grow: 1;
  }
`;

const Main = styled.main`
  padding: 8px;
`;

const Footer = styled.footer`
  display: flex;
  margin-top: 16px;
  padding: 8px;
  justify-content: flex-end;
`;

const Layout = ({ children }) => {
  return (
    <StaticQuery
      query={graphql`
        query {
          site {
            siteMetadata {
              title
            }
          }
        }
      `}
      render={data => (
        <Container>
          <Helmet>
            <link rel="icon" type="image/png" href="/favicon.png" />
          </Helmet>
          <Header>
            <NavList>
              <NavListItem>
                <Link to="/">Momokoi</Link>
              </NavListItem>
              <NavListItem>
                <Link to="/blog">Blog</Link>
              </NavListItem>
              <NavListItem>
                <Link to="/friends">Friends</Link>
              </NavListItem>
              <NavListItem>
                <a href="/rss.xml">RSS</a>
              </NavListItem>
              <NavListItem>
                <Link to="/about">About</Link>
              </NavListItem>
            </NavList>
          </Header>
          <Main>{ children }</Main>
          <Footer>
            <div>
              (C) 2015-2019 Esphas
            </div>
          </Footer>
        </Container>
      )}
    />
  );
};

Layout.propTypes = {
  children: PropTypes.node.isRequired,
};

export default Layout;
