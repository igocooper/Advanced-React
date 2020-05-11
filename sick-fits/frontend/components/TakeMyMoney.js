import React from "react";
import { Mutation } from "react-apollo";
import StripeCheckout from "react-stripe-checkout";
import Router from "next/router";
import NProgress from "nprogress";
import gql from "graphql-tag";
import calcTotalPrice from "../lib/calcTotalPrice";
import Error from "./ErrorMessage";
import User, { CURRENT_USER_QUERY } from "./User";
import { STRIPE_PUBLIC_KEY } from "../config";

const calcItems = (items) =>
  items.reduce((tally, cartItem) => tally + cartItem.quantity, 0);

class TakeMyMoney extends React.Component {
  onToken = (res) => {
    console.log('Token: ', res);
  };

  render() {
    const { children } = this.props;
    return (
      <User>
        {({ data: { me } }) => {
          return (
            <StripeCheckout
              amount={calcTotalPrice(me.cart)}
              name="Sick Fits"
              description={`Order of ${calcItems(me.cart)} items`}
              image={me.cart[0].item && me.cart[0].item.image}
              stripeKey={STRIPE_PUBLIC_KEY}
              email={me.email}
              currency="USD"
              token={res => this.onToken(res)}
            >
              {children}
            </StripeCheckout>
          );
        }}
      </User>
    );
  }
}

export default TakeMyMoney;
