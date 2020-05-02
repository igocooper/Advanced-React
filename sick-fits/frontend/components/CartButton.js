import React from "react";
import PropTypes from 'prop-types';
import { Mutation } from "react-apollo";
import { TOGGLE_CART_MUTATION } from "./Cart";
import CartCount from "./CartCount";

const CartButton = ({ children, count }) => (
  <Mutation mutation={TOGGLE_CART_MUTATION}>
    {(toggleCart) => (
      <button onClick={toggleCart}>
        {children}
        {Boolean(count) && <CartCount count={count} />}
      </button>
    )}
  </Mutation>
);

CartButton.propTypes = {
  count: PropTypes.number,
}

CartButton.defaultProps = {
  count: 0,
}

export default CartButton;
