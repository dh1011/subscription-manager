'use client';

import { useState } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify-icon/react';
import getSymbolFromCurrency from 'currency-symbol-map';
import { parseISO, addDays, addWeeks, addMonths, addYears, format } from 'date-fns';
import { Subscription } from '@/types';

const Container = styled.div`
  background: transparent;
  border-radius: 12px;
  padding: 1.5rem;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
`;

const Title = styled.h2`
  margin: 0;
  font-size: 1.5rem;
  color: #fff;
`;

const Controls = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const Select = styled.select`
  padding: 0.5rem;
  border: 1px solid #444;
  border-radius: 4px;
  background: #2c2c2c;
  color: #fff;
  font-size: 0.9rem;
`;

const List = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const Item = styled(motion.li)`
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 10px;
  margin-bottom: 10px;
  background: rgba(255, 255, 255, 0.05);
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
`;

const ItemInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
  min-width: 200px;
`;

const ItemDetails = styled.div`
  margin-top: 5px;
  padding-top: 0;
  border-top: none;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  font-size: 0.9em;
  color: #ccc;
  flex: 1;
  min-width: 200px;
`;

const ItemActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 10px;
  flex: 1;
  min-width: 150px;
`;

const Button = styled.button<{ variant?: 'delete' }>`
  padding: 5px 10px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  background: ${props => props.variant === 'delete' ? '#E94560' : '#2c2c2c'};
  color: white;
  margin-left: 5px;

  &:hover {
    opacity: 0.9;
  }
`;

const Badge = styled.span`
  background: rgba(255, 255, 255, 0.1);
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.9rem;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  color: #fff;
`;

interface Props {
  subscriptions: Subscription[];
  onEdit: (subscription: Subscription) => void;
  onDelete: (id: number) => void;
  onToggleInclude: (id: number) => void;
  showCurrencySymbol: boolean;
}

function getNextDueDate(subscription: Subscription): Date {
  const today = new Date();
  if (!subscription.dueDate) {
    return today;
  }
  let dueDate = parseISO(subscription.dueDate);
  const intervalValue = subscription.intervalValue ?? 1;
  const intervalUnit = subscription.intervalUnit ?? 'months';

  while (dueDate <= today) {
    switch (intervalUnit) {
      case 'days':
        dueDate = addDays(dueDate, intervalValue);
        break;
      case 'weeks':
        dueDate = addWeeks(dueDate, intervalValue);
        break;
      case 'months':
        dueDate = addMonths(dueDate, intervalValue);
        break;
      case 'years':
        dueDate = addYears(dueDate, intervalValue);
        break;
      default:
        return dueDate;
    }
  }

  return dueDate;
}

export default function SubscriptionList({
  subscriptions,
  onEdit,
  onDelete,
  onToggleInclude,
  showCurrencySymbol
}: Props) {
  const [sortBy, setSortBy] = useState<'dueDate' | 'creditCard' | 'amount'>('dueDate');

  const formatCurrency = (amount: number, currencyCode: string): string => {
    const code = currencyCode || 'USD';
    
    if (showCurrencySymbol) {
      const symbol = getSymbolFromCurrency(code) || '$';
      return `${symbol}${amount.toFixed(2)}`;
    } else {
      return `${amount.toFixed(2)} ${code}`;
    }
  };

  const sortedSubscriptions = [...subscriptions].sort((a, b) => {
    switch (sortBy) {
      case 'dueDate':
        return getNextDueDate(a).getTime() - getNextDueDate(b).getTime();
      case 'creditCard':
        return (a.account || '').localeCompare(b.account || '');
      case 'amount':
        return b.amount - a.amount;
      default:
        return 0;
    }
  });

  return (
    <Container>
      <Header>
        <Title>Subscriptions List</Title>
        <Controls>
          <label htmlFor="sort-select">Sort by: </label>
          <Select
            id="sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          >
            <option value="dueDate">Due Date</option>
            <option value="creditCard">Credit Card</option>
            <option value="amount">Amount</option>
          </Select>
        </Controls>
      </Header>
      <List>
        <AnimatePresence>
          {sortedSubscriptions.map((sub) => (
            <Item
              key={sub.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <ItemInfo>
                <div style={{ position: 'relative' }}>
                  <input
                    type="checkbox"
                    checked={sub.included}
                    onChange={() => onToggleInclude(sub.id!)}
                    style={{
                      position: 'relative',
                      width: '20px',
                      height: '20px',
                      marginRight: '15px',
                      cursor: 'pointer',
                      appearance: 'none',
                      outline: 'none',
                      border: '2px solid #03DAC6',
                      borderRadius: '4px',
                      backgroundColor: sub.included ? '#03DAC6' : 'transparent',
                      transition: 'all 0.3s ease'
                    }}
                  />
                  {sub.included && (
                    <div style={{
                      position: 'absolute',
                      left: '6px',
                      top: '2px',
                      fontSize: '14px',
                      color: '#121212',
                      pointerEvents: 'none'
                    }}>✓</div>
                  )}
                </div>
                <Icon
                  icon={`mdi:${sub.icon}`}
                  style={{ color: sub.color, fontSize: '1.5em', marginRight: '15px' }}
                />
                <div>
                  <p style={{ fontSize: '1.2em', margin: 0, color: '#fff' }}>{sub.name}</p>
                  <p style={{ fontSize: '0.8em', margin: 0, color: '#adadad' }}>
                    {formatCurrency(sub.amount, sub.currency)}/{sub.intervalValue} {sub.intervalUnit}
                  </p>
                </div>
              </ItemInfo>
              <ItemDetails>
                <div style={{ display: 'flex', alignItems: 'center', width: '100%', marginBottom: '5px' }}>
                  <Icon icon="mdi:credit-card" style={{ marginRight: '5px', color: '#45B7D1' }} />
                  <span style={{ color: '#ccc' }}>{sub.account || 'Not Specified'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', marginTop: '5px' }}>
                  <Badge style={{ 
                    display: 'inline-flex', 
                    alignItems: 'center',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '0.8em',
                    margin: '2px 5px 2px 0',
                    whiteSpace: 'nowrap',
                    height: '24px',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    color: '#fff',
                    order: -1
                  }}>
                    {format(getNextDueDate(sub), 'MMM d, yyyy')}
                  </Badge>
                  {Boolean(sub.autopay) && (
                    <Badge style={{ 
                      display: 'inline-flex', 
                      alignItems: 'center',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '0.8em',
                      margin: '2px 5px 2px 0',
                      whiteSpace: 'nowrap',
                      height: '24px',
                      backgroundColor: 'rgba(69, 183, 209, 0.2)',
                      color: '#45B7D1'
                    }}>
                      <Icon icon="mdi:auto-pay" style={{ marginRight: '3px' }} />
                      Autopay
                    </Badge>
                  )}
                  {Boolean(sub.notify) && (
                    <Badge style={{ 
                      display: 'inline-flex', 
                      alignItems: 'center',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '0.8em',
                      margin: '2px 5px 2px 0',
                      whiteSpace: 'nowrap',
                      height: '24px',
                      backgroundColor: 'rgba(255, 253, 107, 0.2)',
                      color: '#fffd6b'
                    }}>
                      <Icon icon="mdi:bell" style={{ marginRight: '3px' }} />
                      Notify
                    </Badge>
                  )}
                </div>
              </ItemDetails>
              <ItemActions>
                <Button onClick={() => onEdit(sub)}>Edit</Button>
                <Button variant="delete" onClick={() => onDelete(sub.id!)}>
                  Delete
                </Button>
              </ItemActions>
            </Item>
          ))}
        </AnimatePresence>
      </List>
    </Container>
  );
} 