import React, { Component } from "react";
import { Mutation } from "react-apollo";
import gql from "graphql-tag";
import { CURRENT_USER_QUERY } from "./User";

const ADD_TO_CART_MUTATION = gql`
  mutation ADD_TO_CART_MUTATION($id: ID!) {
    addToCart(id: $id) {
      id
      quantity
      item {
        id
      }
    }
  }
`;

const update = (cache, payload) => {
  // 1. read cache
  const data = cache.readQuery({ query: CURRENT_USER_QUERY });
  // 2. Check if item is already in the cart and increment quantity if it is
  const { item: itemToAdd, id: cartItemToAddId , quantity} = payload.data.addToCart;
  debugger;
  const existedCartItem = data.me.cart.find(
    (cartItem) => cartItem.item.id === itemToAdd.id
  );

  // handle optimistic response
  if (existedCartItem) {
    if (payload.data.__isOptimistic) {
      existedCartItem.quantity += 1;
    }
  } else {
    // 3. Add fresh cart item if it's not
    data.me.cart.push({
      __typename: 'CartItem',
      id: cartItemToAddId,
      quantity,
      item: {
        __typename: 'Item',
        id: itemToAdd.id,
        image: itemToAdd.image,
        price: itemToAdd.price,
        title: itemToAdd.title,
        description: itemToAdd.description,
      },
    });
  }
  // 4. write update to cache
  cache.writeQuery({ query: CURRENT_USER_QUERY, data });
};

class AddToCart extends Component {
  render() {
    const { id, image, description, title, price } = this.props;
    return (
      <Mutation
        mutation={ADD_TO_CART_MUTATION}
        variables={{ id }}
        // refetchQueries={[{ query: CURRENT_USER_QUERY }]}
        update={update}
        optimisticResponse={{
          __typename: "Mutation",
          __isOptimistic: true,
          addToCart: {
            __typename: "CartItem",
            id: "temporary_optimistic_response_id",
            quantity: 1,
            item: {
              __itemname: "Item",
              id,
              image,
              description,
              title,
              price,
            },
          },
        }}
      >
        {(addToCart, { loading }) => (
          <button onClick={addToCart} disabled={loading}>
            Add{loading && "ing"} To Cart 🛒
          </button>
        )}
      </Mutation>
    );
  }
}

export default AddToCart;
