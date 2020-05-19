import ItemComponent from '../components/Items';
import { shallow, mount } from 'enzyme';
import toJSON from 'enzyme-to-json';
import Item from '../components/Item';

const fakeItem = {
  id: 'ABC123',
  title: 'A Cool Item',
  price: 4000,
  description: 'This item is really cool!',
  image: 'dog.jpg',
  largeImage: 'largedog.jpg',
};

describe('<Item />', () => {
  it('renders image  properly', () => {
    const wrapper = shallow(<Item item={fakeItem}/>);

    const img = wrapper.find('img');
    expect(img.props().src).toBe(fakeItem.image);
    expect(img.props().alt).toBe(fakeItem.title);
  });

  it('renders price tag and title properly', () => {
    const wrapper = shallow(<Item item={fakeItem}/>);

    const PriceTag = wrapper.find('PriceTag');
    expect(PriceTag.children().text()).toBe('$40');

    const title = wrapper.find('Title a').text();
    expect(title).toBe(fakeItem.title);

  });

  it('renders buttons properly', () => {
    const wrapper = shallow(<Item item={fakeItem}/>);

    const buttonList = wrapper.find('.buttonList');

    expect(buttonList.children()).toHaveLength(3);
    expect(buttonList.find('Link')).toHaveLength(1);
    expect(buttonList.find('DeleteItem')).toHaveLength(1);
    expect(buttonList.find('AddToCart')).toHaveLength(1);

  });
});