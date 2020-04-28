import { Query, Mutation } from "react-apollo";
import PropTypes from "prop-types";
import gql from "graphql-tag";
import Error from "./ErrorMessage";
import Table from "./styles/Table";
import SickButton from "./styles/SickButton";

const LIST_OF_ALL_PERMISSONS = [
  "ADMIN",
  "USER",
  "ITEMCREATE",
  "ITEMUPDATE",
  "ITEMDELETE",
  "PERMISSIONUPDATE",
];

const ALL_USERS_QUERY = gql`
  query ALL_USERS_QUERY {
    users {
      id
      name
      email
      permissions
    }
  }
`;

const Permissions = (props) => (
  <Query query={ALL_USERS_QUERY}>
    {({ data, loading, error }) => {
      return (
        <div>
          <Error error={error} />
          <h2>Manage Permissions</h2>
          <Table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                {LIST_OF_ALL_PERMISSONS.map((permission) => (
                  <td key={permission}>{permission}</td>
                ))}
                <th>👇</th>
              </tr>
            </thead>
            <tbody>
              {data.users.map((user) => (
                <UserPermissions key={user.id} user={user} />
              ))}
            </tbody>
          </Table>
        </div>
      );
    }}
  </Query>
);

const UPDATE_PERMISSIONS_MUTATION = gql`
  mutation UPDATE_PERMISSIONS_MUTATION($id: ID!, $permissions: [Permission]!) {
    updatePermissions(id: $id, permissions: $permissions) {
      id
      email
      name
      permissions
    }
  }
`;

class UserPermissions extends React.Component {
  static propsTypes = {
    user: PropTypes.shape({
      id: PropTypes.string,
      name: PropTypes.string,
      email: PropTypes.string,
      permissions: PropTypes.arrayOf(PropTypes.string),
    }).isRequired,
  };

  state = {
    permissions: this.props.user.permissions,
  };

  handlePermissionsUpdate = (updatePermissions) => {
    const { id } = this.props.user;
    const { permissions } = this.state;

    updatePermissions({
      variables: {
        id,
        permissions,
      },
    });
  };

  handlePermissionsChange = (event) => {
    const checkbox = event.target;
    const { permissions } = this.state;

    let updatedPermissions = [...permissions];

    if (checkbox.checked) {
      // add permission
      updatedPermissions.push(checkbox.value);
    } else {
      // filter current permission
      updatedPermissions = updatedPermissions.filter(
        (permission) => permission !== checkbox.value
      );
    }

    this.setState({
      permissions: updatedPermissions,
    });
  };

  render() {
    const { user } = this.props;
    const { permissions } = this.state;
    return (
      <Mutation mutation={UPDATE_PERMISSIONS_MUTATION}>
        {(updatePermissions, { data, loading, error }) => {
          return (
            <>
              {error && (
                <tr>
                  <td colspan="8">
                    <Error error={error} />
                  </td>
                </tr>
              )}
              <tr>
                <td>{user.name}</td>
                <td>{user.email}</td>
                {LIST_OF_ALL_PERMISSONS.map((permission) => {
                  return (
                    <td key={permission}>
                      <label htmlFor={`${user.id}-permission-${permission}`}>
                        <input
                          id={`${user.id}-permission-${permission}`}
                          type="checkbox"
                          value={permission}
                          checked={permissions.includes(permission)}
                          onChange={this.handlePermissionsChange}
                        />
                      </label>
                    </td>
                  );
                })}
                <td>
                  <SickButton
                    type="button"
                    disabled={loading}
                    onClick={() =>
                      this.handlePermissionsUpdate(updatePermissions)
                    }
                  >
                    Updat{ loading ? 'ing' : 'e'}
                  </SickButton>
                </td>
              </tr>
            </>
          );
        }}
      </Mutation>
    );
  }
}

export default Permissions;
