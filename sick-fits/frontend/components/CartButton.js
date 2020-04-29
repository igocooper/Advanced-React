import React from "react";
import { Mutation } from "react-apollo";
import { TOGGLE_CART_MUTATION } from "./Cart";

const CartButton = ({children}) => (
  <Mutation mutation={TOGGLE_CART_MUTATION}>
    {(toggleCart) => <button onClick={toggleCart}>{children}</button>}
  </Mutation>
);

export default CartButton;
