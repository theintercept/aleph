import React, { Component } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import c from 'classnames';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import { Button, Card, Divider, EditableText, Intent, Menu, Popover, Tooltip } from '@blueprintjs/core';
import { PropertyEditor, PropertySelect } from '@alephdata/react-ftm';
import { Entity as FTMEntity } from '@alephdata/followthemoney';


import { selectModel } from 'selectors';
import { Entity, Property, Schema } from 'components/common';


import './TimelineItem.scss';


const messages = defineMessages({
  // search_placeholder: {
  //   id: 'entity.manager.search_placeholder',
  //   defaultMessage: 'Search {schema}',
  // },
  remove: {
    id: 'timeline.item.remove',
    defaultMessage: 'Remove from timeline',
  },
  delete: {
    id: 'timeline.item.delete',
    defaultMessage: 'Delete',
  }
});

class TimelineItem extends Component {
  constructor(props) {
    super(props);
    const { entity, model } = props;

    this.state = {
      entity: entity || new FTMEntity(model, { schema: 'Event', id: `${Math.random()}` }),
      addedProps: []
    }

    this.onSchemaChange = this.onSchemaChange.bind(this);
    this.onPropertyEdit = this.onPropertyEdit.bind(this);
    this.getVisibleProperties = this.getVisibleProperties.bind(this);
    this.renderProperty = this.renderProperty.bind(this);
    this.onNewPropertyAdded = this.onNewPropertyAdded.bind(this);
  }

  onSchemaChange(schema) {
    const { model } = this.props;

    this.setState({
      entity: new FTMEntity(model, { schema, id: `${Math.random()}` })
    });
  }

  onPropertyEdit(entity) {
    this.setState({ entity });
    console.log('in on edit', entity)
    this.props.onUpdate(entity);
  }

  onNewPropertyAdded(prop) {
    this.setState(({ addedProps }) => ({ addedProps: [...addedProps, prop.name] }));
  }

  getVisibleProperties() {
    const { addedProps, entity } = this.state;

    return Array.from(new Set([...entity.schema.featured, ...entity.getProperties().map(prop => prop.name), ...addedProps]));
  }

  renderProperty(propName, options) {
    const { fetchEntitySuggestions } = this.props;
    const { entity } = this.state;

    return (
      <Property.Editable
        key={propName}
        entity={entity}
        prop={propName}
        onEdit={this.onPropertyEdit}
        fetchEntitySuggestions={fetchEntitySuggestions}
        {...options}
      />
    )
  }

  renderDraft() {
    const { entity, onDelete } = this.state;

    const captionProp = entity.schema.caption?.[0];

    return (
      <>
        <Button className="TimelineItem__menu-toggle" minimal icon="cross" onClick={() => onDelete()} />
        <div className="TimelineItem__title bp3-heading">
          <Schema.Select
            optionsFilter={schema => schema.isA('Interval') }
            onSelect={this.onSchemaChange}
          >
            <Button
              minimal
              small
              icon={<Schema.Icon schema={entity.schema} />}
              rightIcon="caret-down"
            >
              <Schema.Label schema={entity.schema} />
            </Button>
          </Schema.Select>
          {captionProp && (
            <>
              <Divider />
              {this.renderProperty(captionProp, { defaultEditing: true, showLabel: true, className: "TimelineItem__property" })}
            </>
          )}
        </div>
      </>
    )
  }

  renderActionMenu() {
    const { intl, onDelete, onRemove } = this.props;
    const { entity } = this.state;

    return (
      <Popover>
        <Button className="TimelineItem__menu-toggle" minimal icon="more" />
        <Menu>
          <Menu.Item
            onClick={() => onRemove(entity.id)}
            text={intl.formatMessage(messages.remove)}
            icon="remove"
          />
          <Menu.Item
            onClick={() => onDelete(entity.id)}
            text={intl.formatMessage(messages.delete)}
            icon="trash"
            intent={Intent.DANGER}
          />
        </Menu>
      </Popover>
    );
  }

  renderTitle() {
    const { entity } = this.state;

    const captionProp = entity.schema.caption?.[0];

    if (captionProp) {
      return (
        <>
          <Tooltip minimal content={<Schema.Label schema={entity.schema} icon />} >
            <Schema.Icon schema={entity.schema} className="left-icon" />
          </Tooltip>
          {this.renderProperty(captionProp)}
        </>
      );
    } else {
      return <span style={{ textTransform: 'italic'}}><Schema.Label schema={entity.schema} icon /></span>
    }
  }


  renderFull() {
    const { intl, model } = this.props;
    const { entity } = this.state;

    const captionProp = entity.schema.caption?.[0];
    // const otherRequiredProps = entity.schema.required.filter(prop => prop !== captionProp);
    const reservedProps = [captionProp, 'date', 'endDate', 'description'];
    const visibleProps = this.getVisibleProperties()
      .filter(prop => reservedProps.indexOf(prop) < 0);

    const availableProps = entity.schema.getEditableProperties()
      .sort((a, b) => a.label.localeCompare(b.label))
      .filter(prop => [...reservedProps, ...visibleProps].indexOf(prop.name) < 0);

    const showEndDate = entity.hasProperty('date');

    return (
      <>
        {this.renderActionMenu()}
        <div className="TimelineItem__main">
          <div className="TimelineItem__title bp3-heading">
            {this.renderTitle(captionProp)}
          </div>
          <div className="TimelineItem__main__content">
            <div className="TimelineItem__date">
              {this.renderProperty('date')}
              {showEndDate && (
                <>
                  <span className="TimelineItem__date__divider text-muted">-</span>
                  {this.renderProperty('endDate')}
                </>
              )}
            </div>
          </div>
        </div>
        <div className="TimelineItem__secondary">
          <div className="TimelineItem__secondary__content">
            {visibleProps.map(prop => this.renderProperty(prop, { showLabel: true, className: "TimelineItem__property" }))}
            <PropertySelect
              properties={availableProps}
              onSelected={this.onNewPropertyAdded}
              buttonProps={{ minimal: true, small: true }}
            />
          </div>
        </div>
      </>
    )

  }

  render() {
    const { isDraft } = this.props;
    const content = isDraft ? this.renderDraft() : this.renderFull();

    return (
      <Card className="TimelineItem" elevation={1}>{content}</Card>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    model: selectModel(state)
  };
};

export default compose(
  connect(mapStateToProps),
  injectIntl,
)(TimelineItem);
