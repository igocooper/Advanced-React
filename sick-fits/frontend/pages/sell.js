import CreateItem from "../components/CreateItem";
import PleaseSignIn from "../components/PleaseSignIn";
import React from "react";

const Sell = (props) => (
  <div>
    <PleaseSignIn>
      <CreateItem />
    </PleaseSignIn>
  </div>
);

export default Sell;