import React from "react";
import PropTypes from "prop-types";
import { Mutation } from "react-apollo";
import gql from "graphql-tag";
import styled from "styled-components";
import { CURRENT_USER_QUERY } from "./User";

const REMOVE_FROM_CART_MUTATION = gql`
  mutation REMOVE_FROM_CART_MUTATION($id: ID!) {
    removeFromCart(id: $id) {
      id
    }
  }
`;

const BigButton = styled.button`
  font-size: 3rem;
  background: none;
  border: 0;
  &:hover {
    color: ${(props) => props.theme.red};
    cursor: pointer;
  }
`;

const update = (cache, payload) => {
  // 1. read from cache
  const data = cache.readQuery({ query: CURRENT_USER_QUERY });
  // 2. remove item from cart
  const cartItemId = payload.data.removeFromCart.id;
  data.me.cart = data.me.cart.filter((cartItem) => cartItem.id !== cartItemId);
  // 3. write it back to cache
  cache.writeQuery({
    query: CURRENT_USER_QUERY,
    data,
  });
};

const RemoveFromCart = ({ id }) => {
  return (
    <Mutation
      mutation={REMOVE_FROM_CART_MUTATION}
      variables={{ id }}
      update={update}
      // refetchQueries={[{query: CURRENT_USER_QUERY}]}
      optimisticResponse={{
        __typename: "Mutation",
        removeFromCart: {
          __typename: "CartItem",
          id,
        },
      }}
    >
      {(removeFromCart, { loading }) => (
        <BigButton
          title="Delete Item"
          disabled={loading}
          onClick={() => {
            removeFromCart().catch((err) => alert(err.message));
          }}
        >
          &times;
        </BigButton>
      )}
    </Mutation>
  );
};

RemoveFromCart.propTypes = {
  id: PropTypes.string.isRequired,
};

export default RemoveFromCart;
