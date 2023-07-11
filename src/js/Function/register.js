import React from 'react'

async function init() {
    await App.initWeb3();
    App.bindEvents();
    return App.loadPets();
  }
  
 function loadPets () {
    return new Promise((resolve, reject) => {
      $.getJSON('src/pets.json', function(data) {
        var petsRow = $('#petsRow');
        var petTemplate = $('#petTemplate');
  
        for (i = 0; i < data.lengh; i++) {
          petTemplate.find('.panel-title').text(data[i].name);
          petTemplate.find('img').attr('src', 'src/images/' + data[i].picture);
          petTemplate.find('.pet-breed').text(data[i].breed);
          petTemplate.find('.pet-age').text(data[i].age);
          petTemplate.find('.pet-location').text(data[i].location);
          petTemplate.find('.btn-adopt').attr('data-id', data[i].id);
  
          petsRow.append(petTemplate.html());
        }
  
        resolve();
      }).fail(function() {
        reject(new Error('Failed to load pets data.'));
      });
    });
  }
  
  export default register