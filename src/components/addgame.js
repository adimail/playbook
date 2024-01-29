import { useState } from 'react';
import { Modal, Button } from 'react-bootstrap';
import Select from 'react-select';
import './main.css';
import { HiMiniArrowSmallDown, HiMiniArrowSmallUp } from "react-icons/hi2";
import { ImBin } from "react-icons/im";
import { BiSolidGame } from "react-icons/bi";

import { addDoc, collection } from 'firebase/firestore';
import { db } from '../config/firebase';

export const AddGameModal = ({ addingNewGame, setAddingNewGame }) => {
  const [gameName, setGameName] = useState('');
  const [gameDescription, setGameDescription] = useState('');
  const [selectedLabels, setSelectedLabels] = useState([]);
  const [rules, setRules] = useState([{ id: 1, value: '', collapsed: false }]);

  const labelOptions = [
    { value: 'Card Games', label: 'Card Games' },
    { value: 'Indoor Games', label: 'Indoor Games' },
    { value: 'Outdoor Games', label: 'Outdoor Games' },
    { value: 'Mobile Games', label: 'Mobile Games' },
    { value: 'Arcade', label: 'Arcade' },
  ];

  const handleLabelChange = (selectedOptions) => {
    setSelectedLabels(selectedOptions);
  };

  const handleAddRule = () => {
    const isValidToAdd =
      rules.length > 0 && !rules.some((rule) => rule.value.trim() === '');

    if (isValidToAdd) {
      const newRule = { id: rules.length + 1, value: '', collapsed: false };
      setRules([...rules, newRule]);
    }
  };

  const handleRuleChange = (id, value) => {
    const newRules = rules.map((rule) =>
      rule.id === id ? { ...rule, value } : rule
    );
    setRules(newRules);
  };

  const handleToggleCollapse = (id) => {
    const newRules = rules.map((rule) =>
      rule.id === id ? { ...rule, collapsed: !rule.collapsed } : rule
    );
    setRules(newRules);
  };

  const handleDeleteRule = (event, id) => {
    event.stopPropagation();

    if (rules.length > 1) {
      const updatedRules = rules.filter((rule) => rule.id !== id);
      const reorderedRules = updatedRules.map((rule, index) => ({
        ...rule,
        id: index + 1,
      }));
      setRules(reorderedRules);
    }
  };

  const handleSubmitGame = async () => {
    try {
      const gameToAdd = {
        name: gameName,
        description: gameDescription,
        labels: selectedLabels.map((label) => label.value),
        rules: rules.map((rule) => rule.value),
      };

      const docRef = await addDoc(collection(db, 'games'), gameToAdd);
      console.log('Game added with ID: ', docRef.id);

      setGameName('');
      setGameDescription('');
      setSelectedLabels([]);
      setRules([{ id: 1, value: '', collapsed: false }]);
      setAddingNewGame(false);
    } catch (error) {
      console.error('Error adding game: ', error);
    }
  };


  return (
    <Modal show={addingNewGame !== false} onHide={() => setAddingNewGame(false)} size="xl" className="custom-modal">
      <Modal.Header closeButton>
        <Modal.Title style={{ alignItems: "center", display: "flex" }}> <BiSolidGame />   Add a New Game to the Public Archive</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className='d-flex flex-column gap-4'>
          <div className='d-flex flex-row gap-3'>
            <img
              src="https://64.media.tumblr.com/6f5909b8f25f8d5203c1568d3a7063f6/tumblr_pi1kc68Jqx1ro8ysbo1_500.gif"
              alt=""
              style={{ height: "100px", width: "100px" }}
            />

            <div className='d-flex flex-column gap-1' style={{ width: "100%" }}>
              <input
                className="form-control"
                placeholder="Name"
                value={gameName}
                onChange={(e) => setGameName(e.target.value)}
              />
              <textarea
                className="form-control"
                placeholder="Description"
                value={gameDescription}
                onChange={(e) => setGameDescription(e.target.value)}
              />
            </div>
          </div>

          <Select
            className="select-input"
            placeholder="Labels"
            isMulti
            options={labelOptions}
            value={selectedLabels}
            onChange={handleLabelChange}
          />

          <div className="accordion">
            {rules.map((rule) => (
              <div key={rule.id} className={`accordion-item`}>
                <div className={`accordion-header`}>
                  <button
                    className="accordion-button"
                    type="button"
                    onClick={() => handleToggleCollapse(rule.id)}
                  >
                    <div className='d-flex justify-content-between align-items-center' style={{ width: "100%" }}>
                      <span>Rule {rule.id}</span>
                      <div className='d-flex justify-content-between align-items-center gap-2'>
                        <ImBin
                          className={`delete-button ${rules.length <= 1 ? 'disabled' : ''}`}
                          onClick={(e) => rules.length > 1 && handleDeleteRule(e, rule.id)}
                          disabled={rules.length <= 1}
                        >
                          Delete
                        </ImBin>
                        {rule.collapsed ? (
                          <HiMiniArrowSmallDown
                            className="collapsible-button"
                            style={{ fontSize: '24px' }}
                            onClick={() => handleToggleCollapse(rule.id)}
                          />
                        ) : (
                          <HiMiniArrowSmallUp
                            className="collapsible-button"
                            style={{ fontSize: '24px' }}
                            onClick={() => handleToggleCollapse(rule.id)}
                          />
                        )}
                      </div>
                    </div>
                  </button>
                </div>
                <div className={`accordion-collapse ${rule.collapsed ? 'collapse' : 'show'}`}>
                  <div>
                    <textarea
                      className="form-control"
                      placeholder={`Enter Rule ${rule.id}`}
                      value={rule.value}
                      onChange={(e) => handleRuleChange(rule.id, e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Button
            variant="primary"
            onClick={handleAddRule}
            disabled={rules.length === 0 || rules.some((rule) => rule.value.trim() === '')}
          >
            Add Another Rule
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmitGame}
            disabled={
              rules.length === 0 || rules.some((rule) => rule.value.trim() === '')
            }
          >
            Submit Game
          </Button>
        </div>
      </Modal.Body>
    </Modal>
  );
};
