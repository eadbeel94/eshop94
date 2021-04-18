/** @namespace Frontend/01-login */

import './style.css';

import { Dropdown } from 'bootstrap/dist/js/bootstrap.bundle';

const dropdownElementList = [].slice.call(document.querySelectorAll('.dropdown-toggle'))
dropdownElementList.map(  dptoggle => new Dropdown(dptoggle) );