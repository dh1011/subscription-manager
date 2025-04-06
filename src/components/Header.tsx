import styled from 'styled-components';

const HeaderContainer = styled.header`
  background-color: #1a1a1a;
  color: white;
  padding: 1rem;
  text-align: center;
`;

const Title = styled.h1`
  margin: 0;
  font-size: 1.5rem;
`;

export default function Header() {
  return (
    <HeaderContainer>
      <Title>Subscription Manager</Title>
    </HeaderContainer>
  );
} 