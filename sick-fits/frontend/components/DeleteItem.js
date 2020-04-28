import React, { Component, Children } from "react";
import { Mutation, Query } from "react-apollo";
import gql from "graphql-tag";
import  { ALL_ITEMS_QUERY } from './Items';

const DELETE_ITEM_MUTATION = gql`
  mutation DELETE_ITEM_MUTATION($id: ID!) {
    deleteItem(id: $id) {
      id
    }
  }
`;

class DeleteItem extends Component {
  update = (cache, payload ) => {
    // manually update the cache on the client so it match the server
    // 1. Read the cache for the item you want 
    const data = cache.readQuery({ query: ALL_ITEMS_QUERY});
    // 2. filter deleted item out of the page
    data.items = data.items.filter(item => item.id !== payload.data.deleteItem.id);
    // 3. Put those items back
    cache.writeQuery({query: ALL_ITEMS_QUERY, data})
  };

  render() {
    const { children, id } = this.props;
    return (
      <Mutation
        mutation={DELETE_ITEM_MUTATION}
        variables={{ id }}
        update={this.update}
      >
        {(deleteItem, { error }) => (
          <button
            onClick={() => {
              if (confirm("Are you sure you want to delete this item?")) {
                deleteItem().catch(err => {
                  alert(err.message);
                });
              }
            }}
          >
            {children}
          </button>
        )}
      </Mutation>
    );
  }
}

export default DeleteItem;
